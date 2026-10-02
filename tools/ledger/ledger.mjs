#!/usr/bin/env node
// Cost ledger for Claude Code transcripts. Dependency-free, Node 24+.
// Run with --help for usage.

import { closeSync, existsSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

const HERE = import.meta.dirname;
const CACHE_VERSION = 2;

const USAGE = `Usage: node ledger.mjs [options]

Reads Claude Code transcripts (main sessions and subagent transcripts) and
prints what the tokens would cost at Anthropic API list prices.

Inputs
  --project <dir>        Claude Code project directory (repeatable). Default: the
                         project dir for the current directory under
                         \${CLAUDE_CONFIG_DIR:-~/.claude}/projects/
  --all-projects         Every project dir under the config dir
  --since <ISO date>     Only messages at or after this time
  --until <ISO date>     Only messages before this time
  --session <id>         Only this session id
  --openrouter <file>    JSONL of OpenRouter calls: model, promptTokens,
                         completionTokens, cost (USD charged, added as-is)
  --prices <file>        Alternative price file (default: prices.json beside this script)

Output
  --by <model|day|session|agent>   Grouping (default model)
  --json                 JSON output
  --markdown             Markdown table output
  --plan-usd <n>         Monthly plan price in USD
  --plan-allowance-usd <n>  Estimated monthly API-equivalent allowance in USD
                         (both flags together add a "share of plan" column)

Caching
  --cache <file>         Cache file (default ./.ledger-cache.json)
  --no-cache             Do not read or write a cache
  --help                 This text
`;

function parseArgs(argv) {
  const opts = { projects: [], by: 'model', cache: resolve('.ledger-cache.json'), useCache: true };
  const needValue = (i, flag) => {
    if (i + 1 >= argv.length) throw new Error(`${flag} needs a value`);
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    switch (a) {
      case '--help': case '-h': opts.help = true; break;
      case '--project': opts.projects.push(resolve(needValue(i, a))); i += 1; break;
      case '--all-projects': opts.allProjects = true; break;
      case '--since': {
        const t = Date.parse(needValue(i, a));
        if (Number.isNaN(t)) throw new Error(`--since: cannot parse "${argv[i + 1]}" as a date`);
        opts.since = t; i += 1; break;
      }
      case '--until': {
        const t = Date.parse(needValue(i, a));
        if (Number.isNaN(t)) throw new Error(`--until: cannot parse "${argv[i + 1]}" as a date`);
        opts.until = t; i += 1; break;
      }
      case '--session': opts.session = needValue(i, a); i += 1; break;
      case '--openrouter': opts.openrouter = resolve(needValue(i, a)); i += 1; break;
      case '--prices': opts.prices = resolve(needValue(i, a)); i += 1; break;
      case '--by': {
        opts.by = needValue(i, a); i += 1;
        if (!['model', 'day', 'session', 'agent'].includes(opts.by)) throw new Error('--by must be model, day, session or agent');
        break;
      }
      case '--json': opts.json = true; break;
      case '--markdown': opts.markdown = true; break;
      case '--plan-usd': opts.planUsd = Number(needValue(i, a)); i += 1; break;
      case '--plan-allowance-usd': opts.allowance = Number(needValue(i, a)); i += 1; break;
      case '--cache': opts.cache = resolve(needValue(i, a)); i += 1; break;
      case '--no-cache': opts.useCache = false; break;
      default: throw new Error(`unknown argument ${a}`);
    }
  }
  const planSet = opts.planUsd !== undefined;
  const allowSet = opts.allowance !== undefined;
  if (planSet !== allowSet) throw new Error('--plan-usd and --plan-allowance-usd must be given together');
  if (planSet && !(opts.planUsd > 0 && opts.allowance > 0)) throw new Error('--plan-usd and --plan-allowance-usd must be positive numbers');
  return opts;
}

function configDir() {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
}

function projectDirs(opts) {
  const root = join(configDir(), 'projects');
  if (opts.allProjects) {
    if (!existsSync(root)) return [];
    return readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => join(root, e.name));
  }
  if (opts.projects.length > 0) return opts.projects;
  return [join(root, process.cwd().replace(/[^a-zA-Z0-9]/g, '-'))];
}

/** Lists main transcripts and subagent transcripts for one project dir. */
function transcriptFiles(projectDir) {
  const files = [];
  if (!existsSync(projectDir)) return files;
  for (const entry of readdirSync(projectDir, { withFileTypes: true })) {
    const path = join(projectDir, entry.name);
    if (entry.isFile() && entry.name.endsWith('.jsonl')) {
      files.push({ path, project: projectDir, session: entry.name.slice(0, -'.jsonl'.length), subagent: false });
    } else if (entry.isDirectory()) {
      const subDir = join(path, 'subagents');
      if (!existsSync(subDir)) continue;
      for (const sub of readdirSync(subDir, { withFileTypes: true })) {
        if (sub.isFile() && sub.name.endsWith('.jsonl')) {
          files.push({ path: join(subDir, sub.name), project: projectDir, session: entry.name, subagent: true });
        }
      }
    }
  }
  return files;
}

function readMeta(path) {
  const metaPath = path.replace(/\.jsonl$/, '.meta.json');
  try {
    return JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    return {};
  }
}

/** Reads the complete lines in [offset, EOF). Returns lines and the new offset (just past the last newline). */
function readNewLines(path, offset, size) {
  const length = size - offset;
  if (length <= 0) return { lines: [], offset, bytes: 0 };
  const buf = Buffer.alloc(length);
  const fd = openSync(path, 'r');
  let got = 0;
  try {
    while (got < length) {
      const n = readSync(fd, buf, got, length - got, offset + got);
      if (n === 0) break;
      got += n;
    }
  } finally {
    closeSync(fd);
  }
  const lastNewline = buf.subarray(0, got).lastIndexOf(0x0a);
  if (lastNewline === -1) return { lines: [], offset, bytes: got };
  const text = buf.subarray(0, lastNewline).toString('utf8');
  return { lines: text.split('\n'), offset: offset + lastNewline + 1, bytes: got };
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/** Folds one transcript line into the per-message-id record, taking the max of every usage field. */
function recordLine(messages, line, file, meta) {
  if (!line.trim()) return;
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    return;
  }
  if (obj?.type !== 'assistant') return;
  const message = obj.message;
  const usage = message?.usage;
  if (!usage || typeof message.id !== 'string') return;
  if (message.model === '<synthetic>') return;

  const sub = file.subagent || obj.isSidechain === true || typeof obj.agentId === 'string';
  const creation = usage.cache_creation;
  const hasSplit = creation && (typeof creation.ephemeral_5m_input_tokens === 'number' || typeof creation.ephemeral_1h_input_tokens === 'number');
  const ts = typeof obj.timestamp === 'string' ? Date.parse(obj.timestamp) : NaN;

  const rec = messages[message.id] ?? {
    model: message.model ?? 'unknown', input: 0, total: 0, w5: 0, w1: 0, split: false, read: 0, output: 0,
    sub: false, agent: 'main', agentId: null, session: obj.sessionId ?? file.session, ts: null, projects: [],
  };
  rec.input = Math.max(rec.input, num(usage.input_tokens));
  rec.total = Math.max(rec.total, num(usage.cache_creation_input_tokens));
  rec.read = Math.max(rec.read, num(usage.cache_read_input_tokens));
  rec.output = Math.max(rec.output, num(usage.output_tokens));
  if (hasSplit) {
    rec.split = true;
    rec.w5 = Math.max(rec.w5, num(creation.ephemeral_5m_input_tokens));
    rec.w1 = Math.max(rec.w1, num(creation.ephemeral_1h_input_tokens));
  }
  if (sub && !rec.sub) {
    rec.sub = true;
    rec.agentId = obj.agentId ?? basename(file.path, '.jsonl').replace(/^agent-/, '');
    rec.agent = meta.agentType ?? obj.attributionAgent ?? obj.agentType ?? 'subagent';
  }
  if (!Number.isNaN(ts) && (rec.ts === null || ts < rec.ts)) rec.ts = ts;
  if (!rec.projects.includes(file.project)) rec.projects.push(file.project);
  messages[message.id] = rec;
}

function loadCache(path) {
  try {
    const cache = JSON.parse(readFileSync(path, 'utf8'));
    if (cache.version === CACHE_VERSION) return cache;
  } catch {
    // missing or corrupt: start again
  }
  return { version: CACHE_VERSION, files: {}, messages: {} };
}

function saveCache(path, cache) {
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(cache));
  renameSync(tmp, path);
}

function scan(opts) {
  const cache = opts.useCache ? loadCache(opts.cache) : { version: CACHE_VERSION, files: {}, messages: {} };
  const stats = { files: 0, filesRead: 0, bytesRead: 0, cacheEnabled: opts.useCache };
  const dirs = projectDirs(opts);
  for (const dir of dirs) {
    for (const file of transcriptFiles(dir)) {
      stats.files += 1;
      const size = statSync(file.path).size;
      const known = cache.files[file.path] ?? { offset: 0 };
      if (size < known.offset) known.offset = 0; // rewritten from scratch
      if (size === known.offset) {
        cache.files[file.path] = known;
        continue;
      }
      const meta = file.subagent ? readMeta(file.path) : {};
      const { lines, offset, bytes } = readNewLines(file.path, known.offset, size);
      for (const line of lines) recordLine(cache.messages, line, file, meta);
      cache.files[file.path] = { offset };
      stats.filesRead += 1;
      stats.bytesRead += bytes;
    }
  }
  if (opts.useCache) saveCache(opts.cache, cache);
  return { cache, stats, dirs };
}

function loadPrices(path) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const ids = Object.keys(data.models).sort((a, b) => b.length - a.length);
  const lookup = (model) => {
    for (const id of ids) {
      if (!model.startsWith(id)) continue;
      const rest = model.slice(id.length);
      if (rest === '' || /^[-@]\d{8}$/.test(rest)) return data.models[id];
    }
    return null;
  };
  return { lookup, meta: { source: data.source, checked: data.checked } };
}

const blank = () => ({ messages: 0, input: 0, w5: 0, w1: 0, read: 0, output: 0, usd: 0, claudeUsd: 0, unpriced: 0, unsplit: 0, models: new Set() });

function add(group, r) {
  group.messages += r.messages;
  group.input += r.input;
  group.w5 += r.w5;
  group.w1 += r.w1;
  group.read += r.read;
  group.output += r.output;
  group.usd += r.usd;
  group.claudeUsd += r.claudeUsd;
  group.unpriced += r.unpriced;
  group.unsplit += r.unsplit;
  for (const m of r.models) group.models.add(m);
}

/** Turns cached message records into priced rows. */
function priceMessages(messages, opts, dirs, prices) {
  const out = [];
  for (const rec of Object.values(messages)) {
    if (!rec.projects.some((p) => dirs.includes(p))) continue;
    if (opts.since !== undefined && (rec.ts === null || rec.ts < opts.since)) continue;
    if (opts.until !== undefined && (rec.ts === null || rec.ts >= opts.until)) continue;
    if (opts.session && rec.session !== opts.session) continue;
    const p = prices.lookup(rec.model);
    const unsplit = !rec.split;
    const w5 = unsplit ? rec.total : Math.max(rec.w5, rec.total - rec.w1);
    const w1 = unsplit ? 0 : rec.w1;
    const usd = p ? (rec.input * p.input + w5 * p.cacheWrite5m + w1 * p.cacheWrite1h + rec.read * p.cacheRead + rec.output * p.output) / 1e6 : 0;
    out.push({
      messages: 1, input: rec.input, w5, w1, read: rec.read, output: rec.output, usd, claudeUsd: usd,
      unpriced: p ? 0 : 1, unsplit: unsplit && rec.total > 0 ? 1 : 0, models: new Set([p ? rec.model : `${rec.model} (UNPRICED)`]),
      sub: rec.sub, agent: rec.agent, session: rec.session, day: rec.ts === null ? 'unknown' : new Date(rec.ts).toISOString().slice(0, 10),
      model: p ? rec.model : `${rec.model} (UNPRICED)`, source: 'claude',
    });
  }
  return out;
}

function openRouterRows(opts) {
  if (!opts.openrouter) return [];
  const rows = [];
  for (const line of readFileSync(opts.openrouter, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let r;
    try {
      r = JSON.parse(line);
    } catch {
      continue;
    }
    const t = typeof r.ts === 'string' ? Date.parse(r.ts) : NaN;
    if (opts.since !== undefined && (Number.isNaN(t) || t < opts.since)) continue;
    if (opts.until !== undefined && (Number.isNaN(t) || t >= opts.until)) continue;
    if (opts.session) continue; // OpenRouter rows carry no Claude session id
    const model = `openrouter:${r.model ?? 'unknown'}`;
    rows.push({
      messages: 1, input: num(r.promptTokens), w5: 0, w1: 0, read: 0, output: num(r.completionTokens), usd: num(r.cost), claudeUsd: 0,
      unpriced: 0, unsplit: 0, models: new Set([model]), sub: false, agent: 'openrouter', session: 'openrouter',
      day: Number.isNaN(t) ? 'unknown' : new Date(t).toISOString().slice(0, 10), model, source: 'openrouter',
    });
  }
  return rows;
}

function report(rows, opts) {
  const keyOf = { model: (r) => r.model, day: (r) => r.day, session: (r) => r.session, agent: (r) => (r.source === 'openrouter' ? 'openrouter' : r.sub ? `subagent:${r.agent}` : 'main') }[opts.by];
  const groups = new Map();
  const split = { main: blank(), subagents: blank(), openrouter: blank() };
  const total = blank();
  for (const r of rows) {
    const k = keyOf(r);
    if (!groups.has(k)) groups.set(k, blank());
    add(groups.get(k), r);
    add(r.source === 'openrouter' ? split.openrouter : r.sub ? split.subagents : split.main, r);
    add(total, r);
  }
  const sorted = [...groups.entries()].sort((a, b) => (opts.by === 'day' ? a[0].localeCompare(b[0]) : b[1].usd - a[1].usd));
  return { sorted, split, total };
}

const fmt = (n) => Math.round(n).toLocaleString('en-US');
const usd = (n) => `$${n.toFixed(2)}`;
const share = (g, opts) => (g.claudeUsd / opts.allowance) * opts.planUsd;

function tableCells(label, g, opts, models) {
  const cells = [label, fmt(g.messages), fmt(g.input), fmt(g.w5), fmt(g.w1), fmt(g.read), fmt(g.output), usd(g.usd)];
  if (opts.planUsd !== undefined) cells.push(g.claudeUsd > 0 || g.messages === 0 ? usd(share(g, opts)) : '-');
  if (models) cells.push([...g.models].sort().join(', '));
  return cells;
}

function headerCells(first, opts, models) {
  const h = [first, 'messages', 'input', 'cache write 5m', 'cache write 1h', 'cache read', 'output', 'API-equiv USD'];
  if (opts.planUsd !== undefined) h.push('share of plan');
  if (models) h.push('models');
  return h;
}

function plainTable(header, body) {
  const all = [header, ...body];
  const widths = header.map((_, i) => Math.max(...all.map((r) => r[i].length)));
  const line = (r) => r.map((c, i) => (i === 0 || header[i] === 'models' ? c.padEnd(widths[i]) : c.padStart(widths[i]))).join('  ').trimEnd();
  return [line(header), widths.map((w) => '-'.repeat(w)).join('  '), ...body.map(line)].join('\n');
}

function mdTable(header, body) {
  const row = (r) => `| ${r.join(' | ')} |`;
  const sep = `|${header.map((_, i) => (i === 0 || header[i] === 'models' ? ' --- ' : ' ---: ')).join('|')}|`;
  return [row(header), sep, ...body.map(row)].join('\n');
}

function render(result, opts, info) {
  const { sorted, split, total } = result;
  const withModels = opts.by !== 'model';
  const table = opts.markdown ? mdTable : plainTable;
  const out = [];
  const body = sorted.map(([k, g]) => tableCells(k, g, opts, withModels));
  body.push(tableCells('TOTAL', total, opts, withModels));
  out.push(table(headerCells(`by ${opts.by}`, opts, withModels), body));
  out.push('');
  const splitBody = Object.entries(split).filter(([, g]) => g.messages > 0).map(([k, g]) => tableCells(k, g, opts, false));
  out.push(table(headerCells('main vs subagents', opts, false), splitBody));
  out.push('');
  if (opts.planUsd !== undefined) {
    out.push(`Share of plan = API-equivalent USD / ${usd(opts.allowance)} estimated monthly allowance * ${usd(opts.planUsd)} plan price. Anthropic publishes no allowance, so this is an estimate that depends entirely on the allowance figure you chose.`);
  }
  out.push(`Total API-equivalent: ${usd(total.usd)} (Claude ${usd(total.claudeUsd)} + OpenRouter as charged ${usd(total.usd - total.claudeUsd)}).`);
  if (total.unpriced > 0) out.push(`WARNING: ${total.unpriced} message(s) use a model with no price in prices.json and are counted as $0 (tokens are still shown). Models: ${[...total.models].filter((m) => m.endsWith('(UNPRICED)')).join(', ')}.`);
  if (total.unsplit > 0) out.push(`Note: ${total.unsplit} message(s) had no 5m/1h cache-write split and were priced at the 5-minute rate.`);
  out.push(`Prices: ${info.prices.source}, checked ${info.prices.checked}. Files ${info.stats.files}, read ${info.stats.filesRead} (${fmt(info.stats.bytesRead)} bytes), cache ${info.stats.cacheEnabled ? 'on' : 'off'}.`);
  return out.join('\n');
}

const plain = (g) => ({ messages: g.messages, input: g.input, cacheWrite5m: g.w5, cacheWrite1h: g.w1, cacheRead: g.read, output: g.output, usd: g.usd, claudeUsd: g.claudeUsd, unpricedMessages: g.unpriced, unsplitCacheWriteMessages: g.unsplit, models: [...g.models].sort() });

function toJson(result, opts, info) {
  const withShare = (g) => (opts.planUsd !== undefined ? { ...plain(g), shareOfPlanUsd: share(g, opts) } : plain(g));
  return {
    groupBy: opts.by,
    rows: result.sorted.map(([key, g]) => ({ key, ...withShare(g) })),
    mainVsSubagents: Object.fromEntries(Object.entries(result.split).map(([k, g]) => [k, withShare(g)])),
    total: withShare(result.total),
    plan: opts.planUsd !== undefined ? { planUsd: opts.planUsd, allowanceUsd: opts.allowance, caveat: 'Anthropic publishes no allowance; share of plan is an estimate that depends entirely on the allowance chosen.' } : null,
    prices: info.prices,
    stats: info.stats,
  };
}

function main() {
  let opts;
  try {
    opts = parseArgs(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n\n${USAGE}`);
    return 2;
  }
  if (opts.help) {
    process.stdout.write(USAGE);
    return 0;
  }
  const prices = loadPrices(opts.prices ?? join(HERE, 'prices.json'));
  const { cache, stats, dirs } = scan(opts);
  const rows = [...priceMessages(cache.messages, opts, dirs, prices), ...openRouterRows(opts)];
  const result = report(rows, opts);
  const info = { prices: prices.meta, stats };
  if (opts.json) process.stdout.write(`${JSON.stringify(toJson(result, opts, info), null, 2)}\n`);
  else process.stdout.write(`${render(result, opts, info)}\n`);
  return 0;
}

process.exitCode = main();
