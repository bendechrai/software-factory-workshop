#!/usr/bin/env node
// evidence: run the same browser steps against one git ref and record what happened.
//
// The ref is checked out into its own detached worktree and started fresh, so the
// record shows that exact commit and nothing from your working folder. A failed
// expectation does not fail the run: on a "before" ref it is the evidence.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { createServer } from "node:net";
import { basename, dirname, join, resolve } from "node:path";
import { chromium } from "@playwright/test";

const USAGE = `Usage: node bin/evidence.mjs --ref <git ref> --out <dir> --name <label> --script <steps.json>

  --ref     commit, branch or tag to capture, for example origin/main or HEAD
  --out     folder for the screenshots and the <label>.json record
  --name    label for this run, for example before or after
  --script  JSON file holding a list of steps, run in order:
              { "goto": "/path" }
              { "fill": "<selector>", "value": "text" }
              { "click": "<selector>" }
              { "expectText": "text", "selector": "<selector>" }   selector defaults to body
              { "screenshot": "<name>" }                           saved as <label>-<name>.png
              { "request": { "method": "POST", "path": "/api/x", "body": {} }, "expectStatus": 201 }

The app runs with HOP_DB=:memory: on a free port. Exit 0 even when an
expectation fails; each step records ok true or false.`;

const STEP_KINDS = ["goto", "fill", "click", "expectText", "screenshot", "request"];
const TIMEOUT_MS = 5000;

function fail(message, code = 1) {
  console.error(`evidence: ${message}`);
  process.exit(code);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === "--help" || key === "-h") {
      console.log(USAGE);
      process.exit(0);
    }
    if (!["--ref", "--out", "--name", "--script"].includes(key) || argv[i + 1] === undefined) {
      fail(`unexpected argument ${key}\n\n${USAGE}`, 2);
    }
    args[key.slice(2)] = argv[i + 1];
    i += 1;
  }
  for (const key of ["ref", "out", "name", "script"]) {
    if (!args[key]) fail(`--${key} is required\n\n${USAGE}`, 2);
  }
  if (!/^[A-Za-z0-9-]+$/.test(args.name)) fail("--name must be letters, digits and hyphens", 2);
  return args;
}

function parseSteps(text) {
  const steps = JSON.parse(text);
  if (!Array.isArray(steps) || steps.length === 0) throw new Error("steps must be a non-empty list");
  steps.forEach((step, i) => {
    const kinds = STEP_KINDS.filter((kind) => step && Object.hasOwn(step, kind));
    if (kinds.length !== 1) throw new Error(`step ${i + 1} must have exactly one of ${STEP_KINDS.join(", ")}`);
    if (kinds[0] === "fill" && typeof step.value !== "string") throw new Error(`step ${i + 1}: fill needs a value`);
    if (kinds[0] === "request" && typeof step.request?.path !== "string") {
      throw new Error(`step ${i + 1}: request needs a path`);
    }
  });
  return steps;
}

function git(args, cwd) {
  const out = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (out.status !== 0) fail(`git ${args.join(" ")} failed: ${out.stderr.trim()}`);
  return out.stdout.trim();
}

function freePort() {
  return new Promise((done, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => done(port));
    });
  });
}

async function waitForApp(base, app) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (app.exitCode !== null) throw new Error(`the app exited with code ${app.exitCode}`);
    try {
      await fetch(base);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  throw new Error("the app did not start within 30 seconds");
}

async function readBody(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text.length > 500 ? `${text.slice(0, 500)}...` : text;
  }
}

async function runStep(step, page, base, out, label) {
  if ("goto" in step) {
    const response = await page.goto(base + step.goto);
    return { ok: true, status: response?.status() ?? null, url: page.url().replace(base, "") };
  }
  if ("fill" in step) {
    await page.fill(step.fill, step.value, { timeout: TIMEOUT_MS });
    return { ok: true };
  }
  if ("click" in step) {
    await page.click(step.click, { timeout: TIMEOUT_MS });
    return { ok: true };
  }
  if ("expectText" in step) {
    const locator = page.locator(step.selector ?? "body");
    try {
      await locator.filter({ hasText: step.expectText }).first().waitFor({ timeout: TIMEOUT_MS });
      return { ok: true, actual: (await locator.first().innerText()).slice(0, 300) };
    } catch {
      const actual = await locator.first().innerText({ timeout: 1000 }).catch(() => null);
      return { ok: false, actual: actual === null ? null : actual.slice(0, 300) };
    }
  }
  if ("screenshot" in step) {
    const file = `${label}-${step.screenshot}.png`;
    await page.screenshot({ path: join(out, file), fullPage: true });
    return { ok: true, file };
  }
  const { method = "GET", path, body } = step.request;
  const response = await page.request.fetch(base + path, {
    method,
    data: body,
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
  });
  const status = response.status();
  const ok = step.expectStatus === undefined || step.expectStatus === status;
  return { ok, status, body: await readBody(response) };
}

async function capture({ worktree, steps, out, label }) {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const app = spawn("node", ["src/server.ts"], {
    cwd: worktree,
    env: { ...process.env, HOP_DB: ":memory:", PORT: String(port) },
    stdio: "ignore",
  });
  const browser = await chromium.launch();
  try {
    await waitForApp(base, app);
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const results = [];
    for (const step of steps) {
      let result;
      try {
        result = await runStep(step, page, base, out, label);
      } catch (error) {
        result = { ok: false, error: error instanceof Error ? error.message.split("\n")[0] : String(error) };
      }
      results.push({ step, ...result });
      console.log(`${result.ok ? "ok  " : "FAIL"} ${JSON.stringify(step)}`);
    }
    return results;
  } finally {
    await browser.close();
    app.kill("SIGTERM");
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const steps = parseSteps(readFileSync(args.script, "utf8"));
  const out = resolve(args.out);
  mkdirSync(out, { recursive: true });

  const repo = git(["rev-parse", "--show-toplevel"]);
  const commit = git(["rev-parse", "--verify", `${args.ref}^{commit}`], repo);
  // Run from a ticket worktree, the top level is that worktree. The main
  // checkout owns the shared .git, and the worktrees folder sits beside it.
  const mainCheckout = dirname(resolve(repo, git(["rev-parse", "--git-common-dir"], repo)));
  const worktree = join(dirname(mainCheckout), `${basename(mainCheckout)}.worktrees`, `evidence-${args.name}`);
  if (existsSync(worktree)) git(["worktree", "remove", "--force", worktree], repo);
  git(["worktree", "add", "--detach", worktree, commit], repo);

  try {
    const install = spawnSync("npm", ["ci", "--no-audit", "--no-fund"], { cwd: worktree, stdio: ["ignore", 2, 2] });
    if (install.status !== 0) throw new Error("npm ci failed in the worktree");
    const results = await capture({ worktree, steps, out, label: args.name });
    const record = {
      label: args.name,
      ref: args.ref,
      commit,
      shortCommit: commit.slice(0, 7),
      capturedAt: new Date().toISOString(),
      passed: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      steps: results,
    };
    writeFileSync(join(out, `${args.name}.json`), `${JSON.stringify(record, null, 2)}\n`);
    console.log(`evidence: ${args.name} at ${record.shortCommit}: ${record.passed} ok, ${record.failed} failed`);
    console.log(`evidence: wrote ${join(args.out, `${args.name}.json`)}`);
  } finally {
    git(["worktree", "remove", "--force", worktree], repo);
  }
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
