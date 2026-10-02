import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

function generateCode() {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

export function openDatabase(path) {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE IF NOT EXISTS links (
      code TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )
  `);

  const insert = db.prepare("INSERT INTO links (code, url) VALUES (?, ?)");
  const selectOne = db.prepare("SELECT code, url, clicks, created_at FROM links WHERE code = ?");
  const selectAll = db.prepare("SELECT code, url, clicks, created_at FROM links ORDER BY created_at DESC");
  const bump = db.prepare("UPDATE links SET clicks = clicks + 1 WHERE code = ? RETURNING url");

  return {
    create(url) {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const code = generateCode();
        try {
          insert.run(code, url);
          return selectOne.get(code);
        } catch (err) {
          if (!String(err.message).includes("UNIQUE")) throw err;
        }
      }
      throw new Error("Could not generate a unique code");
    },
    get(code) {
      return selectOne.get(code) ?? null;
    },
    list() {
      return selectAll.all();
    },
    recordClick(code) {
      const row = bump.get(code);
      return row ? row.url : null;
    },
    close() {
      db.close();
    },
  };
}
