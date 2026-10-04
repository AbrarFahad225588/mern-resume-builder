import { assertConnection, closePool } from "./pool.js";
import { runMigrations } from "./migrate.js";

/**
 * Applies schema.sql without starting the server.
 *
 *   npm run db:migrate
 *
 * The server already does this on every boot; this exists for updating the
 * database on its own, e.g. after pulling a schema change.
 */
const main = async () => {
  try {
    await assertConnection();
    const applied = await runMigrations();
    console.log(`Schema verified (${applied} statements)`);
  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    // The pool holds the event loop open; without this the script hangs.
    await closePool();
  }
};

main();
