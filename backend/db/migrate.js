import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "./pool.js";

// Lines inside a CREATE TABLE body that define a key or constraint, not a
// column. `REFERENCES` covers the continuation line of a multi-line FOREIGN KEY.
const NON_COLUMN_LINE =
  /^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN|FULLTEXT|SPATIAL|CHECK|REFERENCES)\b/i;

/**
 * Extracts `{ table, columns: [{ name, definition }] }` from a CREATE TABLE
 * statement, or null for any other statement. Relies on schema.sql keeping one
 * column definition per line.
 */
const parseCreateTable = (statement) => {
  const header = statement.match(
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(/i,
  );
  if (!header) return null;

  const body = statement.slice(
    header.index + header[0].length,
    statement.lastIndexOf(")"),
  );

  const columns = body
    .split("\n")
    .map((line) => line.trim().replace(/,$/, ""))
    .filter((line) => line && !line.startsWith("#") && !NON_COLUMN_LINE.test(line))
    .flatMap((line) => {
      const column = line.match(/^`?(\w+)`?\s+(.+)$/);
      return column ? [{ name: column[1], definition: column[2] }] : [];
    });

  return { table: header[1], columns };
};

/**
 * Adds any column declared in schema.sql that the live table lacks.
 *
 * `CREATE TABLE IF NOT EXISTS` skips a table that already exists, so without
 * this a column added to schema.sql never reaches an existing database and
 * queries fail with ER_BAD_FIELD_ERROR. Columns are only ever added, never
 * dropped or altered: removing one would destroy data, which must stay a
 * deliberate, manual step.
 */
const addMissingColumns = async (connection, { table, columns }) => {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME AS name
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table],
  );
  const existing = new Set(rows.map((row) => row.name.toLowerCase()));

  for (const { name, definition } of columns) {
    if (existing.has(name.toLowerCase())) continue;
    await connection.query(
      `ALTER TABLE \`${table}\` ADD COLUMN \`${name}\` ${definition}`,
    );
    console.log(`Added missing column ${table}.${name}`);
  }
};

/**
 * Applies schema.sql at boot.
 *
 * Every statement is `CREATE TABLE IF NOT EXISTS`, followed by adding any
 * columns the existing table is missing, so running this repeatedly is a no-op
 * once the schema is current. That makes startup self-healing on a fresh clone
 * and after schema.sql gains a column, without anyone remembering to run a
 * separate migrate step.
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

      const table = parseCreateTable(statement);
      if (table) await addMissingColumns(connection, table);
    }
  } finally {
    connection.release();
  }

  return statements.length;
};
