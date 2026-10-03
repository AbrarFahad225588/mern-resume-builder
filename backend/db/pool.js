import mysql from "mysql2/promise";
import { config } from "../config/env.js";

/**
 * The single MySQL connection pool for the process.
 *
 * A pool rather than individual connections: opening a TCP connection per
 * request costs a round trip and MySQL caps `max_connections`, so a busy
 * endpoint would start failing with "too many connections" under load.
 */
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  // Return DATETIME as a JS Date so the API keeps emitting ISO strings, which
  // is what the old Mongoose responses produced and what the frontend formats.
  dateStrings: false,
  // Guards against a subtle correctness bug: mysql2 reuses one prepared
  // statement cache per connection, and unbounded growth leaks memory.
  maxPreparedStatements: 200,
  charset: "utf8mb4_unicode_ci",
});

/**
 * Runs a parameterised query and returns only the rows.
 *
 * Everything in the data layer goes through here or `withTransaction`, so all
 * user input arrives as bound parameters. String-concatenating SQL is what
 * makes injection possible; `?` placeholders make it structurally impossible.
 */
export const query = async (sql, params = []) => {
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Runs `fn` inside a transaction, committing on success and rolling back on
 * any thrown error.
 *
 * A resume write spans seven tables (the parent plus six section tables).
 * Without a transaction a mid-way failure would leave a resume whose sections
 * are half-old and half-new — exactly the corruption the editor cannot recover
 * from. The connection is always released, even if the rollback itself fails,
 * otherwise the pool would slowly starve.
 */
export const withTransaction = async (fn) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await fn(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // A rollback failure must not mask the original error, which is the one
      // that actually explains what went wrong.
    }
    throw error;
  } finally {
    connection.release();
  }
};

/** Verifies the database is reachable before the server accepts traffic. */
export const assertConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};

export const closePool = () => pool.end();
