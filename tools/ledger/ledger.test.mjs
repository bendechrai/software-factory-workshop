import assert from 'node:assert/strict';
import { appendFileSync, mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { after, before, describe, test } from 'node:test';

const LEDGER = join(import.meta.dirname, 'ledger.mjs');

let root;
let projA;
let projB;
let orFile;

function assistant({ id, model = 'claude-sonnet-5-5', input = 0, output = 0, read = 0, w5, w1, total, ts = '2026-10-01T10:00:00.000Z', session = 'sess-a', sidechain = false, agentId }) {
  const usage = { input_tokens: input, output_tokens: output, cache_read_input_tokens: read, cache_creation_input_tokens: total ?? (w5 ?? 0) + (w1 ?? 0) };
  if (w5 !== undefined || w1 !== undefined) usage.cache_creation = { ephemeral_5m_input_tokens: w5 ?? 0, ephemeral_1h_input_tokens: w1 ?? 0 };
  const line = { type: 'assistant', isSidechain: sidechain, sessionId: session, timestamp: ts, message: { id, model, role: 'assistant', usage } };
  if (agentId) line.agentId = agentId;
  return JSON.stringify(line);
}

function run(args, cwd = root) {
  const result = spawnSync(process.execPath, [LEDGER, ...args], { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

const runJson = (args) => JSON.parse(run([...args, '--json']));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

before(() => {
  root = realpathSync(mkdtempSync(join(tmpdir(), 'ledger-test-')));
  projA = join(root, 'projects', 'A');
  projB = join(root, 'projects', 'B');
  mkdirSync(join(projA, 'sess-a', 'subagents'), { recursive: true });
  mkdirSync(projB, { recursive: true });

  // Project A main: msg_dup appears three times with differing output (max 300, not 600); msg_split has a 5m/1h split.
  writeFileSync(join(projA, 'sess-a.jsonl'), [
    assistant({ id: 'msg_dup', model: 'claude-opus-5-5', input: 100, output: 10, read: 1000 }),
    assistant({ id: 'msg_dup', model: 'claude-opus-5-5', input: 100, output: 300, read: 1000 }),
    assistant({ id: 'msg_dup', model: 'claude-opus-5-5', input: 100, output: 290, read: 1000 }),
    assistant({ id: 'msg_split', model: 'claude-fable-5-1', w5: 1000000, w1: 1000000 }),
    '{"type":"user","message":{"content":"ignored"}}',
    'not json at all',
  ].join('\n') + '\n');

  // Subagent transcript with a meta file; one message has no cache split.
  writeFileSync(join(projA, 'sess-a', 'subagents', 'agent-abc.jsonl'), [
    assistant({ id: 'msg_sub', model: 'claude-haiku-4-5-20251001', input: 1000000, sidechain: true, agentId: 'abc' }),
    assistant({ id: 'msg_nosplit', model: 'claude-haiku-4-5', total: 1000000, sidechain: true, agentId: 'abc' }),
  ].join('\n') + '\n');
  writeFileSync(join(projA, 'sess-a', 'subagents', 'agent-abc.meta.json'), JSON.stringify({ agentType: 'reviewer', model: 'haiku' }));

  // Project B: unknown model, later day, plus a synthetic message that must be skipped.
  writeFileSync(join(projB, 'sess-b.jsonl'), [
    assistant({ id: 'msg_unk', model: 'claude-mystery-9', input: 5000, output: 7, session: 'sess-b', ts: '2026-10-03T10:00:00.000Z' }),
    assistant({ id: 'msg_synth', model: '<synthetic>', input: 5, session: 'sess-b' }),
  ].join('\n') + '\n');

  orFile = join(root, 'or.jsonl');
  writeFileSync(orFile, [
    JSON.stringify({ ts: '2026-10-02T00:00:00Z', model: 'openai/gpt-x', promptTokens: 55, completionTokens: 5, cost: 0.25 }),
    JSON.stringify({ ts: '2026-10-02T00:01:00Z', model: 'openai/gpt-x', promptTokens: 10, completionTokens: 1, cost: 0.5 }),
  ].join('\n') + '\n');
});

after(() => rmSync(root, { recursive: true, force: true }));

describe('ledger', () => {
  test('de-duplicates by message id taking the max, never summing', () => {
    const out = runJson(['--no-cache', '--project', projA]);
    const opus = out.rows.find((r) => r.key === 'claude-opus-5-5');
    assert.equal(opus.messages, 1);
    assert.equal(opus.output, 300);
    assert.equal(opus.input, 100);
    assert.equal(opus.cacheRead, 1000);
    // 100*4 + 300*20 + 1000*0.2 per million
    close(opus.usd, (400 + 6000 + 200) / 1e6);
  });

  test('prices 5m and 1h cache writes at their own rates', () => {
    const out = runJson(['--no-cache', '--project', projA]);
    const fable = out.rows.find((r) => r.key === 'claude-fable-5-1');
    assert.equal(fable.cacheWrite5m, 1000000);
    assert.equal(fable.cacheWrite1h, 1000000);
    close(fable.usd, 12.5 + 20);
  });

  test('counts subagent transcripts as subagent and falls back to 5m when no split', () => {
    const out = runJson(['--no-cache', '--project', projA]);
    assert.equal(out.mainVsSubagents.subagents.messages, 2);
    assert.equal(out.mainVsSubagents.main.messages, 2);
    // dated haiku id matches claude-haiku-4-5: 1M input at $1, plus 1M unsplit cache write at the 5m rate $1.25
    close(out.mainVsSubagents.subagents.usd, 1 + 1.25);
    assert.equal(out.total.unsplitCacheWriteMessages, 1);
    const byAgent = runJson(['--no-cache', '--by', 'agent', '--project', projA]);
    assert.ok(byAgent.rows.some((r) => r.key === 'subagent:reviewer'));
    assert.ok(byAgent.rows.some((r) => r.key === 'main'));
  });

  test('reports an unknown model as unpriced instead of zero', () => {
    const out = runJson(['--no-cache', '--project', projB]);
    const row = out.rows.find((r) => r.key.includes('claude-mystery-9'));
    assert.ok(row.key.endsWith('(UNPRICED)'));
    assert.equal(row.unpricedMessages, 1);
    assert.equal(row.input, 5000);
    assert.equal(out.rows.length, 1, 'synthetic message is skipped');
    assert.match(run(['--no-cache', '--project', projB]), /WARNING: 1 message/);
  });

  test('adds OpenRouter rows at charged cost', () => {
    const out = runJson(['--no-cache', '--project', projA, '--openrouter', orFile]);
    const or = out.rows.find((r) => r.key === 'openrouter:openai/gpt-x');
    assert.equal(or.messages, 2);
    assert.equal(or.input, 65);
    close(or.usd, 0.75);
    close(out.mainVsSubagents.openrouter.usd, 0.75);
    close(out.total.usd - out.total.claudeUsd, 0.75);
  });

  test('--since, --session, multiple --project and --by day', () => {
    const since = runJson(['--no-cache', '--project', projA, '--project', projB, '--since', '2026-10-02']);
    assert.equal(since.total.messages, 1);
    const sess = runJson(['--no-cache', '--project', projA, '--project', projB, '--session', 'sess-b']);
    assert.equal(sess.total.messages, 1);
    const days = runJson(['--no-cache', '--project', projA, '--project', projB, '--by', 'day']);
    assert.deepEqual(days.rows.map((r) => r.key), ['2026-10-01', '2026-10-03']);
  });

  test('default project comes from cwd under CLAUDE_CONFIG_DIR', () => {
    const cfg = join(root, 'cfg');
    const cwd = join(root, 'my.repo');
    mkdirSync(cwd, { recursive: true });
    const dir = join(cfg, 'projects', cwd.replace(/[^a-zA-Z0-9]/g, '-'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 's.jsonl'), `${assistant({ id: 'msg_cwd', input: 1 })}\n`);
    const result = spawnSync(process.execPath, [LEDGER, '--no-cache', '--json'], { cwd, encoding: 'utf8', env: { ...process.env, CLAUDE_CONFIG_DIR: cfg } });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).total.messages, 1);
  });

  test('share of plan needs both flags and prints the caveat', () => {
    const bad = spawnSync(process.execPath, [LEDGER, '--no-cache', '--project', projA, '--plan-usd', '200'], { encoding: 'utf8' });
    assert.notEqual(bad.status, 0);
    const text = run(['--no-cache', '--project', projA, '--plan-usd', '200', '--plan-allowance-usd', '2000']);
    assert.match(text, /share of plan/);
    assert.match(text, /Anthropic publishes no allowance/);
    const json = runJson(['--no-cache', '--project', projA, '--plan-usd', '200', '--plan-allowance-usd', '2000']);
    close(json.total.shareOfPlanUsd, (json.total.claudeUsd / 2000) * 200);
  });

  test('cache gives the same totals on a second run and picks up appended lines without double counting', () => {
    const cache = join(root, 'cache.json');
    const args = ['--cache', cache, '--project', projA];
    const first = runJson(args);
    assert.ok(first.stats.bytesRead > 0);
    const second = runJson(args);
    assert.equal(second.stats.bytesRead, 0);
    assert.deepEqual(second.total, first.total);

    // Append a later snapshot of an already-seen id (must merge) and one new message.
    appendFileSync(join(projA, 'sess-a.jsonl'), `${assistant({ id: 'msg_dup', model: 'claude-opus-5-5', input: 100, output: 500, read: 1000 })}\n${assistant({ id: 'msg_new', model: 'claude-opus-5-5', output: 1000000 })}\n`);
    const third = runJson(args);
    assert.ok(third.stats.bytesRead > 0);
    assert.equal(third.total.messages, first.total.messages + 1);
    const opus = third.rows.find((r) => r.key === 'claude-opus-5-5');
    assert.equal(opus.output, 500 + 1000000);
    // Same answer as a cold read with no cache.
    const cold = runJson(['--no-cache', '--project', projA]);
    assert.deepEqual(cold.total, third.total);
  });

  test('a partial trailing line is not consumed until completed', () => {
    const dir = join(root, 'projects', 'C');
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 's.jsonl');
    const full = assistant({ id: 'msg_part', input: 10 });
    writeFileSync(file, full.slice(0, 20));
    const cache = join(root, 'cache-c.json');
    assert.equal(runJson(['--cache', cache, '--project', dir]).total.messages, 0);
    appendFileSync(file, `${full.slice(20)}\n`);
    assert.equal(runJson(['--cache', cache, '--project', dir]).total.messages, 1);
  });

  test('--help prints usage', () => {
    assert.match(run(['--help']), /Usage:/);
  });
});
