import http from "node:http";
import { readFile } from "node:fs/promises";
import { openStore } from "./db.js";

export function parseUrl(input) {
  try {
    const u = new URL(String(input).trim());
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1e5) reject(new Error("too large"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export function createServer(store, baseUrl) {
  const json = (res, status, body) => {
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(body));
  };
  return http.createServer(async (req, res) => {
    try {
      const { pathname } = new URL(req.url, "http://x");
      const base = baseUrl || `http://${req.headers.host}`;
      const withShort = (l) => ({ ...l, short: `${base}/${l.code}` });

      if (req.method === "GET" && (pathname === "/" || pathname === "/app.js" || pathname === "/style.css")) {
        const file = pathname === "/" ? "index.html" : pathname.slice(1);
        const type = file.endsWith(".js") ? "text/javascript" : file.endsWith(".css") ? "text/css" : "text/html";
        res.writeHead(200, { "content-type": type });
        return res.end(await readFile(new URL(`./public/${file}`, import.meta.url)));
      }
      if (req.method === "GET" && pathname === "/api/links") {
        return json(res, 200, store.list().map(withShort));
      }
      if (req.method === "POST" && pathname === "/api/links") {
        let body;
        try {
          body = JSON.parse(await readBody(req));
        } catch {
          return json(res, 400, { error: "invalid JSON" });
        }
        const url = parseUrl(body?.url);
        if (!url) return json(res, 400, { error: "url must be a valid http(s) URL" });
        return json(res, 201, withShort(store.create(url)));
      }
      const m = req.method === "GET" && pathname.match(/^\/([a-z0-9]{4,12})$/);
      if (m) {
        const row = store.hit(m[1]);
        if (row) {
          res.writeHead(302, { location: row.url });
          return res.end();
        }
      }
      json(res, 404, { error: "not found" });
    } catch (e) {
      json(res, 500, { error: e.message });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT) || 4123;
  const store = openStore(process.env.DB_FILE || "hop.db");
  createServer(store, process.env.BASE_URL).listen(port, () => console.log(`hop listening on http://localhost:${port}`));
}
