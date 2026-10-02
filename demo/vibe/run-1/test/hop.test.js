import { test } from "node:test";
import assert from "node:assert/strict";
import { openStore } from "../db.js";
import { createServer } from "../server.js";

test("create, redirect, count clicks", async () => {
  const store = openStore(":memory:");
  const server = createServer(store);
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  try {
    const bad = await fetch(`${base}/api/links`, { method: "POST", body: JSON.stringify({ url: "nope" }) });
    assert.equal(bad.status, 400);

    const created = await fetch(`${base}/api/links`, { method: "POST", body: JSON.stringify({ url: "https://example.com/long" }) });
    assert.equal(created.status, 201);
    const link = await created.json();

    for (let i = 0; i < 2; i++) {
      const r = await fetch(`${base}/${link.code}`, { redirect: "manual" });
      assert.equal(r.status, 302);
      assert.equal(r.headers.get("location"), "https://example.com/long");
    }
    const list = await (await fetch(`${base}/api/links`)).json();
    assert.equal(list[0].clicks, 2);
    assert.equal((await fetch(`${base}/zzzzzz`)).status, 404);
  } finally {
    server.close();
    store.close();
  }
});
