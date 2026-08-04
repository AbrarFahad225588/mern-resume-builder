import { AppError } from "../../shared/AppError.js";
import * as resumeRepository from "./resume.repository.js";

/**
 * Business rules for resumes: ownership, payload sanitisation and the
 * "not found" decision. The repository handles SQL; the controller handles
 * HTTP; everything in between belongs here.
 */

/**
 * Strips fields the client must never control.
 *
 * Ownership and identity are decided by the auth middleware. Without this, a
 * payload containing `user` or `_id` would be spread into the write and could
 * reassign a resume to another account — the same guard the previous
 * implementation applied before `$set`.
 */
const sanitizePayload = (body = {}) => {
  const { user, _id, id, __v, createdAt, updatedAt, user_id, ...safe } = body;
  return safe;
};

/**
 * A malformed id is a client mistake, not a server fault.
 *
 * Mongo rejected non-ObjectId strings up front; the SQL equivalent would
 * happily run a lookup that always misses, so the length guard keeps the same
 * 404-instead-of-500 behaviour without a pointless round trip.
 */
const isPlausibleId = (id) => typeof id === "string" && id.length > 0 && id.length <= 36;

export const listForUser = (userId) => resumeRepository.findAllByUser(userId);

export const getForUser = async (id, userId) => {
  if (!isPlausibleId(id)) {
    throw AppError.notFound("Resume not found");
  }
  const resume = await resumeRepository.findByIdForUser(id, userId);
  if (!resume) {
    throw AppError.notFound("Resume not found");
  }
  return resume;
};

export const createForUser = (userId, body) =>
  resumeRepository.create(userId, sanitizePayload(body));

export const updateForUser = async (id, userId, body) => {
  if (!isPlausibleId(id)) {
    throw AppError.notFound("Resume not found");
  }
  const updated = await resumeRepository.update(id, userId, sanitizePayload(body));
  if (!updated) {
    throw AppError.notFound("Resume not found");
  }
  return updated;
};

export const deleteForUser = async (id, userId) => {
  if (!isPlausibleId(id)) {
    throw AppError.notFound("Resume not found");
  }
  const deleted = await resumeRepository.remove(id, userId);
  if (!deleted) {
    throw AppError.notFound("Resume not found");
  }
};
