import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789";

function makeCode(len = 6) {
  const bytes = randomBytes(len);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function openStore(file = "hop.db") {
  const db = new DatabaseSync(file);
  db.exec(`CREATE TABLE IF NOT EXISTS links (
    code TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    clicks INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
  const insert = db.prepare("INSERT INTO links (code, url) VALUES (?, ?)");
  const find = db.prepare("SELECT * FROM links WHERE code = ?");
  const bump = db.prepare("UPDATE links SET clicks = clicks + 1 WHERE code = ?");
  const all = db.prepare("SELECT code, url, clicks, created_at FROM links ORDER BY created_at DESC, rowid DESC");
  return {
    create(url) {
      for (let i = 0; i < 5; i++) {
        const code = makeCode();
        try {
          insert.run(code, url);
          return find.get(code);
        } catch (e) {
          if (!String(e.message).includes("UNIQUE")) throw e;
        }
      }
      throw new Error("could not allocate code");
    },
    hit(code) {
      const row = find.get(code);
      if (row) bump.run(code);
      return row;
    },
    list: () => all.all(),
    close: () => db.close(),
  };
}
