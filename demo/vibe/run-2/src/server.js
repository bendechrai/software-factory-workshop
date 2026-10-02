import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { openStore } from "./db.js";
import { createHandler } from "./app.js";

const port = Number(process.env.PORT ?? 4242);
const dbFile = process.env.HOP_DB ?? fileURLToPath(new URL("../data/hop.db", import.meta.url));

const store = openStore(dbFile);
const server = createServer(createHandler(store));

server.listen(port, () => {
  console.log(`hop listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
