import mysql from "mysql2/promise";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { config } from "../config/env.js";

/**
 * One-time privileged setup: creates the database and the application user.
 *
 *   npm run db:setup
 *
 * This exists as a Node script rather than a `mysql < bootstrap.sql` command
 * because the CLI client is often not on PATH on Windows, and PowerShell does
 * not support the `<` redirection operator at all. Going through mysql2 — which
 * the project already depends on — removes both failure modes.
 *
 * The root password is prompted for and never written to disk or .env; only the
 * scoped application account is persisted.
 */

const ROOT_USER = process.env.MYSQL_ROOT_USER || "root";

const statements = (dbName, appUser, appPassword) => [
  [
    `CREATE DATABASE IF NOT EXISTS \`${dbName}\`
       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    `database "${dbName}" ready`,
  ],
  [
    `CREATE USER IF NOT EXISTS ?@'localhost' IDENTIFIED BY ?`,
    `user "${appUser}" ready`,
    [appUser, appPassword],
  ],
  // Re-applied on every run so changing DB_PASSWORD in .env and re-running is
  // enough to resynchronise the account.
  [
    `ALTER USER ?@'localhost' IDENTIFIED BY ?`,
    "password synchronised",
    [appUser, appPassword],
  ],
  // Deliberately not GRANT ALL: the application never needs DROP or the
  // server-wide privileges root carries.
  [
    `GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, INDEX, ALTER, REFERENCES
       ON \`${dbName}\`.* TO ?@'localhost'`,
    "privileges granted",
    [appUser],
  ],
  [`FLUSH PRIVILEGES`, "privileges flushed"],
];

const main = async () => {
  const { host, port, database, user: appUser, password: appPassword } = config.db;

  let rootPassword = process.env.MYSQL_ROOT_PASSWORD;
  if (rootPassword === undefined) {
    const rl = createInterface({ input: stdin, output: stdout });
    rootPassword = await rl.question(`MySQL "${ROOT_USER}" password: `);
    rl.close();
  }

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user: ROOT_USER,
      password: rootPassword,
      // No `database` here: it may not exist yet, and naming it would make the
      // connection itself fail with ER_BAD_DB_ERROR.
    });
  } catch (error) {
    if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error(`\nAccess denied for "${ROOT_USER}". Wrong password?`);
    } else if (error.code === "ECONNREFUSED") {
      console.error(`\nNo MySQL server reachable at ${host}:${port}.`);
    } else {
      console.error(`\n${error.message}`);
    }
    process.exit(1);
  }

  try {
    for (const [sql, label, params] of statements(database, appUser, appPassword)) {
      await connection.query(sql, params);
      console.log(`  ${label}`);
    }
    console.log(`\nSetup complete. Run "npm run seed" then "npm run dev".`);
  } catch (error) {
    console.error(`\nSetup failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
};

main();
