/** User-facing models. Nothing here talks to the database. */

import { z } from 'zod';

export const userCreateSchema = z.object({
  email: z.string().email(),
  display_name: z.string().min(1).max(80),
  country: z.string().length(2),
  marketing_opt_in: z.boolean().default(false),
});

/** Build an internal User model. Mirrors the pydantic User defaults. */
export function makeUser({
  id,
  email,
  display_name,
  country,
  tier = 'standard',
  marketing_opt_in = false,
  joined_on = null,
}) {
  return { id, email, display_name, country, tier, marketing_opt_in, joined_on };
}

/** The shape routers return in list responses. */
export function makeUserSummary({ id, display_name, country, tier = 'standard' }) {
  return { id, display_name, country, tier };
}
