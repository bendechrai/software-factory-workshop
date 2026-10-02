import { createApp } from "./app.js";
import { openDatabase } from "./db.js";

const PORT = Number(process.env.PORT ?? 4310);
const DB_PATH = process.env.HOP_DB ?? "./data/hop.sqlite";

const db = openDatabase(DB_PATH);
const server = createApp(db).listen(PORT, () => {
  console.log(`hop listening on http://localhost:${PORT} (db: ${DB_PATH})`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
