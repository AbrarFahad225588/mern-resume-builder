import crypto from "node:crypto";

/**
 * The User model: the shape of the table and the translation between a raw
 * database row and the domain object the rest of the app works with.
 *
 * Keeping this mapping in one place means SQL column names never leak past the
 * repository. The API contract still exposes `_id` (not `id`) because the
 * frontend already stores and compares that field — renaming it would be a
 * breaking change for no gain.
 */
export const USER_TABLE = "users";

export const USER_COLUMNS = Object.freeze({
  id: "id",
  name: "name",
  email: "email",
  password: "password",
  createdAt: "created_at",
});

export const newUserId = () => crypto.randomUUID();

/** Normalises an email for storage and lookup. */
export const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

/**
 * Row -> public user. The password hash is never included, so it cannot be
 * leaked by a controller that forgets to strip it.
 */
export const toPublicUser = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
};

/** Row -> internal user, including the hash, for password verification only. */
export const toAuthUser = (row) => {
  if (!row) return null;
  return { ...toPublicUser(row), password: row.password };
};
