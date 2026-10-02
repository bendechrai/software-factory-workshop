import express from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const CODE_PATTERN = /^[a-zA-Z0-9]{6}$/;

export function normaliseUrl(input) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    if (parsed.hostname !== "localhost") return null;
  }
  return parsed.href;
}

function baseUrl(req) {
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return `${proto}://${req.get("host")}`;
}

function present(link, req) {
  return {
    code: link.code,
    url: link.url,
    clicks: link.clicks,
    createdAt: link.created_at,
    shortUrl: `${baseUrl(req)}/${link.code}`,
  };
}

export function createApp(db) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use(express.static(join(here, "public")));

  app.get("/api/links", (req, res) => {
    res.json(db.list().map((link) => present(link, req)));
  });

  app.post("/api/links", (req, res) => {
    const url = normaliseUrl(req.body?.url);
    if (!url) {
      res.status(400).json({ error: "Please provide a valid http or https URL." });
      return;
    }
    if (url.length > 2048) {
      res.status(400).json({ error: "URL is too long (max 2048 characters)." });
      return;
    }
    res.status(201).json(present(db.create(url), req));
  });

  app.get("/api/links/:code", (req, res) => {
    const link = db.get(req.params.code);
    if (!link) {
      res.status(404).json({ error: "Not found." });
      return;
    }
    res.json(present(link, req));
  });

  app.get("/:code", (req, res, next) => {
    const { code } = req.params;
    if (!CODE_PATTERN.test(code)) {
      next();
      return;
    }
    const url = db.recordClick(code);
    if (!url) {
      next();
      return;
    }
    res.redirect(302, url);
  });

  app.use((req, res) => {
    res.status(404).type("text").send("Not found");
  });

  return app;
}
