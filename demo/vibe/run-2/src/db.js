import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(length = 6) {
  const bytes = randomBytes(length);
  let code = "";
  for (const b of bytes) code += ALPHABET[b % ALPHABET.length];
  return code;
}

export function openStore(file) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      code TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);

  const insert = db.prepare("INSERT INTO links (code, url) VALUES (?, ?)");
  const byCode = db.prepare("SELECT code, url, clicks, created_at AS createdAt FROM links WHERE code = ?");
  const all = db.prepare("SELECT code, url, clicks, created_at AS createdAt FROM links ORDER BY created_at DESC, rowid DESC");
  const hit = db.prepare("UPDATE links SET clicks = clicks + 1 WHERE code = ? RETURNING url");

  return {
    create(url) {
      for (let attempt = 0; attempt < 10; attempt++) {
        const code = generateCode();
        try {
          insert.run(code, url);
          return byCode.get(code);
        } catch (err) {
          if (!String(err.message).includes("UNIQUE")) throw err;
        }
      }
      throw new Error("Could not generate a unique code");
    },
    get(code) {
      return byCode.get(code);
    },
    list() {
      return all.all();
    },
    recordClick(code) {
      const row = hit.get(code);
      return row ? row.url : undefined;
    },
    close() {
      db.close();
    },
  };
}
