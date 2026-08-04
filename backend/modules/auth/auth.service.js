import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { config } from "../../config/env.js";
import { AppError } from "../../shared/AppError.js";
import * as userRepository from "./user.repository.js";
import { normalizeEmail } from "./user.model.js";

/**
 * Business rules for authentication.
 *
 * This layer owns hashing, token issuing and the "already exists / invalid
 * credentials" decisions. It never touches `req` or `res`, which is what makes
 * it reusable (a CLI or a job could call `register` directly) and testable
 * without spinning up Express.
 */

const SALT_ROUNDS = 10;

const signToken = (userId) =>
  jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

export const register = async ({ name, email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  // Checked explicitly so the caller gets "User already exists" rather than a
  // raw ER_DUP_ENTRY. The UNIQUE constraint still backs this up if two
  // registrations race, since this check alone is not atomic.
  if (await userRepository.existsByEmail(normalizedEmail)) {
    throw AppError.badRequest("User already exists");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user;
  try {
    user = await userRepository.create({
      name,
      email: normalizedEmail,
      passwordHash,
    });
  } catch (error) {
    // The race described above: translate the constraint violation into the
    // same message the pre-check produces.
    if (error?.code === "ER_DUP_ENTRY") {
      throw AppError.badRequest("User already exists");
    }
    throw error;
  }

  return { user, token: signToken(user._id) };
};

export const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(normalizeEmail(email));

  // Deliberately identical messages for "no such user" and "wrong password".
  // Distinguishing them would let an attacker enumerate registered emails.
  if (!user) {
    throw AppError.badRequest("Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw AppError.badRequest("Invalid credentials");
  }

  const { password: _password, ...publicUser } = user;
  return { user: publicUser, token: signToken(publicUser._id) };
};

/** Resolves the account behind a verified token, for the auth middleware. */
export const getUserById = (id) => userRepository.findPublicById(id);
