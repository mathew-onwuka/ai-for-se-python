/**
 * User service.
 *
 * Service functions are named <resource><Verb>. They throw typed errors and
 * return models, never bare objects.
 */

import { db } from '../common/db.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors.js';
import { makeUser } from './models.js';
import { userDisplayNameNormalise, userFromRow, userSummaryFromRow } from './transforms.js';

const BLOCKED_DOMAINS = new Set(['example.invalid', 'mailinator.com']);

/** Return one user. Throws NotFoundError when the id is unknown. */
export function userFind(userId) {
  if (!userId) {
    throw new ValidationError('user id is required');
  }
  const row = db.dbCustomerFind(userId);
  return userFromRow(row);
}

/** Every user in a country at a tier, ordered by display name. */
export function userSearch(country, tier = 'standard') {
  country = country.trim().toUpperCase();
  if (country.length !== 2) {
    throw new ValidationError('country must be a two-letter code', { context: { country } });
  }
  const rows = db.dbCustomersSearch(country, tier);
  return rows.map(userSummaryFromRow);
}

/** Create a user after normalising the parts we own. */
export function userCreate(payload) {
  const email = payload.email.trim().toLowerCase();
  const domain = email.slice(email.lastIndexOf('@') + 1);
  if (BLOCKED_DOMAINS.has(domain)) {
    throw new ValidationError('that email domain is not accepted', { context: { domain } });
  }

  let exists = true;
  try {
    db.dbCustomerFind(email);
  } catch (exc) {
    if (exc instanceof NotFoundError) {
      exists = false;
    } else {
      throw exc;
    }
  }
  if (exists) {
    throw new ConflictError('a user with that email already exists', { context: { email } });
  }

  return makeUser({
    id: email,
    email,
    display_name: userDisplayNameNormalise(payload.display_name),
    country: payload.country.trim().toUpperCase(),
    marketing_opt_in: payload.marketing_opt_in ?? false,
  });
}

/** Move a user between tiers. */
export function userTierSet(userId, tier) {
  const allowed = new Set(['standard', 'plus', 'enterprise']);
  if (!allowed.has(tier)) {
    throw new ValidationError('unknown tier', {
      context: { tier, allowed: [...allowed].sort() },
    });
  }
  const current = userFind(userId);
  return { ...current, tier };
}
