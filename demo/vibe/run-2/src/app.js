import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const INDEX_HTML = readFileSync(fileURLToPath(new URL("../public/index.html", import.meta.url)));
const MAX_BODY = 16 * 1024;

export function normalizeUrl(input) {
  if (typeof input !== "string") return undefined;
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > 4096) return undefined;
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    if (!parsed.hostname) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function withShortUrl(req, link) {
  const host = req.headers.host ?? "localhost";
  return { ...link, shortUrl: `http://${host}/${link.code}` };
}

export function createHandler(store) {
  return async function handler(req, res) {
    const { pathname } = new URL(req.url ?? "/", "http://localhost");

    if (req.method === "GET" && pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(INDEX_HTML);
      return;
    }

    if (pathname === "/api/links") {
      if (req.method === "GET") {
        sendJson(res, 200, store.list().map((l) => withShortUrl(req, l)));
        return;
      }
      if (req.method === "POST") {
        let payload;
        try {
          payload = JSON.parse(await readBody(req));
        } catch {
          sendJson(res, 400, { error: "Request body must be JSON like {\"url\": \"...\"}" });
          return;
        }
        const url = normalizeUrl(payload?.url);
        if (!url) {
          sendJson(res, 400, { error: "Please provide a valid http(s) URL" });
          return;
        }
        sendJson(res, 201, withShortUrl(req, store.create(url)));
        return;
      }
      res.writeHead(405, { Allow: "GET, POST" });
      res.end();
      return;
    }

    const match = /^\/([A-Za-z0-9]{1,32})$/.exec(pathname);
    if (req.method === "GET" && match) {
      const target = store.recordClick(match[1]);
      if (target) {
        res.writeHead(302, { Location: target, "Cache-Control": "no-store" });
        res.end();
        return;
      }
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  };
}
