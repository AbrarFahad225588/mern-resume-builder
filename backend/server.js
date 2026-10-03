import { createApp } from "./app.js";
import { config } from "./config/env.js";
import { assertConnection, closePool } from "./db/pool.js";
import { runMigrations } from "./db/migrate.js";

/**
 * Process entry point: connect, migrate, then listen.
 *
 * The database must be reachable *before* the server accepts traffic.
 * Listening first leaves a window where routes run against a dead pool and
 * every request answers 500 (e.g. "Failed to fetch templates").
 */
const startServer = async () => {
  try {
    await assertConnection();
    console.log(`Connected to MySQL database "${config.db.database}"`);

    const applied = await runMigrations();
    console.log(`Schema verified (${applied} statements)`);
  } catch (error) {
    // A misconfigured database is not something the app can recover from, and
    // a half-running server would only produce confusing 500s. Fail loudly.
    console.error("Failed to initialise the database:", error.message);
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("Check DB_USER / DB_PASSWORD in backend/.env");
    }
    if (error.code === "ER_BAD_DB_ERROR") {
      console.error(
        "Database missing. Run: mysql -u root -p < backend/db/bootstrap.sql",
      );
    }
    if (error.code === "ECONNREFUSED") {
      console.error(`No MySQL server at ${config.db.host}:${config.db.port}`);
    }
    process.exit(1);
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`Server is running on http://localhost:${config.port}`);
  });

  // Without this the pool keeps its sockets open and the process ignores
  // Ctrl-C / container stop signals until it is force-killed.
  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();
