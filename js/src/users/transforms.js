/**
 * Row-to-model transformations for the users package.
 *
 * Services call these. Services never build models inline.
 */

import { makeUser, makeUserSummary } from './models.js';

export function userFromRow(row) {
  const joined = row.joined_on;
  return makeUser({
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    country: row.country,
    tier: row.tier ?? 'standard',
    marketing_opt_in: Boolean(row.marketing_opt_in ?? 0),
    joined_on: typeof joined === 'string' ? new Date(joined) : (joined ?? null),
  });
}

export function userSummaryFromRow(row) {
  return makeUserSummary({
    id: row.id,
    display_name: row.display_name,
    country: row.country,
    tier: row.tier ?? 'standard',
  });
}

/** Collapse whitespace and trim. Case is left as the user typed it. */
export function userDisplayNameNormalise(raw) {
  return raw.split(/\s+/).filter(Boolean).join(' ');
}
