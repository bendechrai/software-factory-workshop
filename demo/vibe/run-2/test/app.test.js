import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { openStore } from "../src/db.js";
import { createHandler, normalizeUrl } from "../src/app.js";

let server;
let store;
let base;

before(async () => {
  store = openStore(":memory:");
  server = createServer(createHandler(store));
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  store.close();
});

async function shorten(url) {
  return fetch(`${base}/api/links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

test("normalizeUrl accepts http(s) and adds https when missing", () => {
  assert.equal(normalizeUrl("https://example.com/a"), "https://example.com/a");
  assert.equal(normalizeUrl("example.com/path"), "https://example.com/path");
  assert.equal(normalizeUrl("javascript:alert(1)"), undefined);
  assert.equal(normalizeUrl("ftp://example.com"), undefined);
  assert.equal(normalizeUrl(""), undefined);
  assert.equal(normalizeUrl(42), undefined);
});

test("home page is served", async () => {
  const res = await fetch(base);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /hop/);
});

test("creating a link, redirecting, and counting clicks", async () => {
  const res = await shorten("https://example.com/some/very/long/path?x=1");
  assert.equal(res.status, 201);
  const link = await res.json();
  assert.match(link.code, /^[A-Za-z0-9]{6}$/);
  assert.equal(link.clicks, 0);
  assert.equal(link.shortUrl, `${base}/${link.code}`);

  for (let i = 0; i < 3; i++) {
    const hop = await fetch(link.shortUrl, { redirect: "manual" });
    assert.equal(hop.status, 302);
    assert.equal(hop.headers.get("location"), "https://example.com/some/very/long/path?x=1");
  }

  const list = await (await fetch(`${base}/api/links`)).json();
  const found = list.find((l) => l.code === link.code);
  assert.equal(found.clicks, 3);
});

test("invalid input is rejected", async () => {
  assert.equal((await shorten("not a url")).status, 400);
  assert.equal((await shorten("javascript:alert(1)")).status, 400);
  const bad = await fetch(`${base}/api/links`, { method: "POST", body: "{nope" });
  assert.equal(bad.status, 400);
});

test("unknown codes return 404", async () => {
  const res = await fetch(`${base}/doesnotexist`, { redirect: "manual" });
  assert.equal(res.status, 404);
});
