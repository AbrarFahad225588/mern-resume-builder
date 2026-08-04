import { query } from "../../db/pool.js";
import { newUserId, toAuthUser, toPublicUser } from "./user.model.js";

/**
 * Data access for users — raw parameterised SQL, no ORM.
 *
 * This layer knows about tables and columns and nothing else: it performs no
 * hashing, no token work and no HTTP. That separation is what allows the
 * service layer to be tested against a fake repository, and keeps SQL out of
 * business logic.
 */

export const findById = async (id) => {
  const rows = await query(
    `SELECT id, name, email, password, created_at
       FROM users
      WHERE id = ?
      LIMIT 1`,
    [id],
  );
  return toAuthUser(rows[0]);
};

/** Public projection: used by the auth middleware, which must not see hashes. */
export const findPublicById = async (id) => {
  const rows = await query(
    `SELECT id, name, email, created_at
       FROM users
      WHERE id = ?
      LIMIT 1`,
    [id],
  );
  return toPublicUser(rows[0]);
};

export const findByEmail = async (email) => {
  const rows = await query(
    `SELECT id, name, email, password, created_at
       FROM users
      WHERE email = ?
      LIMIT 1`,
    [email],
  );
  return toAuthUser(rows[0]);
};

export const existsByEmail = async (email) => {
  const rows = await query(`SELECT 1 FROM users WHERE email = ? LIMIT 1`, [
    email,
  ]);
  return rows.length > 0;
};

/**
 * Inserts a user and returns the public record.
 *
 * The id is generated in the application rather than by the database so the
 * caller knows it without a second round trip (LAST_INSERT_ID does not apply
 * to CHAR(36) keys).
 */
export const create = async ({ name, email, passwordHash }) => {
  const id = newUserId();
  await query(
    `INSERT INTO users (id, name, email, password)
     VALUES (?, ?, ?, ?)`,
    [id, name, email, passwordHash],
  );
  return findPublicById(id);
};
