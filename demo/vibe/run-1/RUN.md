# hop

## Stack
Node.js (v26) with only built-in modules: `node:http` server, `node:sqlite` for storage, vanilla HTML/JS/CSS front end. Zero npm dependencies.

## How to run
    npm start            # http://localhost:4123 (override with PORT, DB_FILE, BASE_URL)
    npm test

API: `POST /api/links` with `{"url": "..."}` creates a link; `GET /api/links` lists links with click counts; `GET /<code>` redirects (302) and counts a click.

## Files
- package.json, .gitignore
- server.js (HTTP server, routes, URL validation)
- db.js (SQLite store, code generation, click counting)
- public/index.html, public/app.js, public/style.css (UI)
- test/hop.test.js (end-to-end test)
- screenshot.png, RUN.md

## Data storage
SQLite file `hop.db` in the working directory (table `links`: code, url, clicks, created_at). Created automatically.

## Tests
Yes: one node:test end-to-end test (create, invalid URL, redirect, click count, 404). Passes.
