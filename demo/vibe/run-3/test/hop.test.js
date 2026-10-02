import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createApp, normaliseUrl } from "../app.js";
import { openDatabase } from "../db.js";

let server;
let base;
let db;

before(async () => {
  db = openDatabase(":memory:");
  server = createApp(db).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
});

test("normaliseUrl accepts http(s) and adds a scheme when missing", () => {
  assert.equal(normaliseUrl("https://example.com/a?b=c"), "https://example.com/a?b=c");
  assert.equal(normaliseUrl("example.com/path"), "https://example.com/path");
  assert.equal(normaliseUrl("ftp://example.com"), null);
  assert.equal(normaliseUrl("javascript:alert(1)"), null);
  assert.equal(normaliseUrl("   "), null);
  assert.equal(normaliseUrl("not a url"), null);
});

test("POST /api/links creates a short link", async () => {
  const res = await fetch(`${base}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.com/very/long/path" }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.match(body.code, /^[a-zA-Z0-9]{6}$/);
  assert.equal(body.url, "https://example.com/very/long/path");
  assert.equal(body.clicks, 0);
  assert.equal(body.shortUrl, `${base}/${body.code}`);
});

test("POST /api/links rejects invalid URLs", async () => {
  const res = await fetch(`${base}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "nope" }),
  });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.error);
});

test("GET /:code redirects and counts clicks", async () => {
  const created = await (await fetch(`${base}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://example.org/landing" }),
  })).json();

  for (let i = 0; i < 3; i += 1) {
    const res = await fetch(`${base}/${created.code}`, { redirect: "manual" });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "https://example.org/landing");
  }

  const detail = await (await fetch(`${base}/api/links/${created.code}`)).json();
  assert.equal(detail.clicks, 3);

  const list = await (await fetch(`${base}/api/links`)).json();
  const found = list.find((link) => link.code === created.code);
  assert.equal(found.clicks, 3);
});

test("unknown codes return 404", async () => {
  const res = await fetch(`${base}/zzzzzz`, { redirect: "manual" });
  assert.equal(res.status, 404);
  const api = await fetch(`${base}/api/links/zzzzzz`);
  assert.equal(api.status, 404);
});
