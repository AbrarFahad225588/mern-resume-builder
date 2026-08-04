import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";

/**
 * Applies schema.sql at boot.
 *
 * Every statement is `CREATE TABLE IF NOT EXISTS`, so running this repeatedly
 * is a no-op once the schema exists. That makes startup self-healing on a
 * fresh clone without anyone remembering to run a separate migrate step.
 */
export const runMigrations = async () => {
  const schemaPath = path.join(import.meta.dirname, "schema.sql");
  const sql = await readFile(schemaPath, "utf8");

  // Strip comments before splitting: a `;` inside a comment would otherwise
  // split one statement into two invalid halves.
  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  // A dedicated connection keeps all DDL on one session, and `query` (not
  // `execute`) is required because MySQL cannot prepare DDL statements.
  const connection = await pool.getConnection();
  try {
    for (const statement of statements) {
      await connection.query(statement);
    }
  } finally {
    connection.release();
  }

  return statements.length;
};
