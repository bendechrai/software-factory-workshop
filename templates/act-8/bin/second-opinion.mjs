#!/usr/bin/env node
// A cross-vendor second opinion on a pull request, through OpenRouter.
// No dependencies: Node's fetch, gh and the repository's own files.
import { appendFileSync, existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://openrouter.ai/api/v1/chat/completions";
// Two roles, two vendors, neither Anthropic. The reviewer is OpenAI's flagship
// reasoning model; the challenger is Z.ai's full GLM reasoning model.
const DEFAULT_MODELS = { review: "openai/gpt-5.6-sol", challenge: "z-ai/glm-5.3" };
const PROMPTS = { review: ".agents/review/reviewer.md", challenge: ".agents/review/challenger.md" };
const USAGE_LOG = join(ROOT, ".agents/review/openrouter-usage.jsonl");
const MAX_CHARS = 200000;

const USAGE = `Usage: node bin/second-opinion.mjs --pr <n> [--role review|challenge] [--against <file>] [--model <openrouter model id>] [--change <name>] [--out <file>]

Reads pull request <n> with a non-Claude model through OpenRouter, using a
role prompt, the rubric, the change's OpenSpec artifacts and gh pr diff <n>.
Prints the result, writes it to --out if given, and appends one line of
token use, cost and role to .agents/review/openrouter-usage.jsonl.

Two roles, two different models:
  review     (default) .agents/review/reviewer.md, default model ${DEFAULT_MODELS.review}
  challenge  .agents/review/challenger.md, default model ${DEFAULT_MODELS.challenge}
             Argues against merging and against any earlier review.
             Same VERDICT and SCORE header, so results compare.

  --pr <n>          pull request number (required)
  --role <role>     review or challenge (default review)
  --against <file>  challenge only: an earlier review to test and rebut
  --model <id>      OpenRouter model id (default depends on --role)
  --change <name>   OpenSpec change (default: the "Change:" line of the PR body)
  --out <file>      also write the result to this file

Needs OPENROUTER_API_KEY in the environment (exit 2 if unset) and gh.
Nothing is posted to GitHub.`;

function die(message, code = 1) {
  process.stderr.write(`second-opinion: ${message}\n`);
  process.exit(code);
}

function parseArgs(argv) {
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      process.stdout.write(`${USAGE}\n`);
      process.exit(0);
    }
    if (!["--pr", "--role", "--against", "--model", "--change", "--out"].includes(arg)) die(`unknown argument ${arg}\n\n${USAGE}`);
    if (argv[i + 1] === undefined) die(`${arg} needs a value`);
    flags[arg.slice(2)] = argv[++i];
  }
  if (!/^\d+$/.test(flags.pr ?? "")) die(`--pr <n> is required\n\n${USAGE}`);
  flags.role ??= "review";
  if (!(flags.role in PROMPTS)) die(`--role must be review or challenge\n\n${USAGE}`);
  if (flags.against && flags.role !== "challenge") die(`--against only applies to --role challenge\n\n${USAGE}`);
  return flags;
}

function run(cmd, args) {
  try {
    return execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    return die(`${cmd} ${args.join(" ")} failed: ${e.message}`);
  }
}

function changeDir(change) {
  const live = join(ROOT, "openspec/changes", change);
  if (existsSync(live)) return live;
  const archive = join(ROOT, "openspec/changes/archive");
  const hit = existsSync(archive) && readdirSync(archive).find((d) => d.endsWith(`-${change}`));
  return hit ? join(archive, hit) : die(`no OpenSpec change named ${change}`);
}

function markdownFiles(dir) {
  return readdirSync(dir).sort().flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return markdownFiles(path);
    return name.endsWith(".md") ? [path] : [];
  });
}

function section(title, body) {
  return `## ${title}\n\n${body.trim()}\n\n`;
}

function buildPrompt(pr, changeFlag, role, againstFile) {
  const body = run("gh", ["pr", "view", pr, "--json", "body", "-q", ".body"]);
  const change = changeFlag ?? body.match(/^Change:\s*`?(?:openspec\/changes\/)?([\w.-]+)/m)?.[1];
  if (!change) die('no "Change:" line in the PR body; pass --change <name>');
  const dir = changeDir(change);
  const read = (p) => readFileSync(join(ROOT, p), "utf8");
  const artifacts = markdownFiles(dir).map((p) => section(p.slice(ROOT.length + 1), readFileSync(p, "utf8")));
  const system = `${read(PROMPTS[role])}\n\nYou are running without tools: you cannot run commands, read other files or post anything. Everything you may use is in the user message. Reply with the ${role === "challenge" ? "challenge" : "review"} only, in the Output format above.`;
  let user = section(".agents/review/rubric.md", read(".agents/review/rubric.md")) +
    section("AGENTS.md", read("AGENTS.md")) +
    section("DEFINITION_OF_DONE.md", read("DEFINITION_OF_DONE.md")) +
    section(`PR #${pr} body (change: ${change})`, body) +
    artifacts.join("") +
    section(`gh pr diff ${pr}`, run("gh", ["pr", "diff", pr]));
  if (user.length > MAX_CHARS) user = `${user.slice(0, MAX_CHARS)}\n\n[TRUNCATED: ${user.length - MAX_CHARS} characters cut to fit the size cap]`;
  if (againstFile) {
    if (!existsSync(resolve(againstFile))) die(`no such file: ${againstFile}`);
    user += section("Earlier review to test (--against)", readFileSync(resolve(againstFile), "utf8"));
  }
  return { system, user };
}

async function ask(key, model, prompt) {
  const res = await fetch(API, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json", "X-Title": "hop review" },
    body: JSON.stringify({
      model,
      usage: { include: true },
      messages: [{ role: "system", content: prompt.system }, { role: "user", content: prompt.user }],
    }),
  }).catch((e) => die(`network failure: ${e.cause?.message ?? e.message}`));
  const text = await res.text();
  if (!res.ok) die(`HTTP ${res.status} from OpenRouter: ${text.slice(0, 1000)}`);
  const data = JSON.parse(text);
  if (data.error) die(`OpenRouter error: ${JSON.stringify(data.error).slice(0, 1000)}`);
  return data;
}

function logUsage(pr, role, model, data) {
  const u = data.usage ?? {};
  const timestamp = new Date().toISOString();
  // ts is the field the workshop ledger reads for --since and --by day.
  const line = { timestamp, ts: timestamp, pr: Number(pr), role, model: data.model ?? model,
    promptTokens: u.prompt_tokens ?? 0, completionTokens: u.completion_tokens ?? 0,
    cost: typeof u.cost === "number" ? u.cost : 0 };
  appendFileSync(USAGE_LOG, `${JSON.stringify(line)}\n`);
  return line;
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) die("OPENROUTER_API_KEY is not set. Export it for this command; it is never read from a file.", 2);
  const model = flags.model ?? DEFAULT_MODELS[flags.role];
  const data = await ask(key, model, buildPrompt(flags.pr, flags.change, flags.role, flags.against));
  const line = logUsage(flags.pr, flags.role, model, data);
  const review = data.choices?.[0]?.message?.content?.trim();
  if (!review) die(`empty answer (finish_reason: ${data.choices?.[0]?.finish_reason ?? "unknown"})`);
  if (flags.out) writeFileSync(resolve(flags.out), `${review}\n`);
  process.stdout.write(`${review}\n\n[role ${line.role}, model ${line.model}, tokens ${line.promptTokens}/${line.completionTokens}, cost $${line.cost}]\n`);
}

main();
