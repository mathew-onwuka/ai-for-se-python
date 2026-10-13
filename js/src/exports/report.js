/**
 * Operational reports.
 *
 * These run from a scheduler, not from the API. Nothing in the request path
 * imports this module.
 */

import Decimal from 'decimal.js';

import { db } from '../common/db.js';
import { dump } from '../common/serialize.js';
import { NotFoundError } from '../errors.js';
import { orderSubmit as buildOrder } from '../orders/service.js';
import { NonEmptyLines } from '../protocols.js';

const gate = new NonEmptyLines();

/** Total value of everything a customer has pending. */
export function reportPendingValue(customerId) {
  const rows = db.dbOrdersForCustomer(customerId);
  if (rows.length === 0) {
    throw new NotFoundError('customer has no orders', { context: { customer_id: customerId } });
  }
  const pending = rows.filter((r) => r.status === 'pending');
  return pending.reduce(
    (sum, r) => sum.plus(new Decimal(String(r.total ?? '0'))),
    new Decimal('0'),
  );
}

/**
 * Turn saved draft rows back into orders so we can value them.
 *
 * Drafts are captured by the storefront before submission, so they arrive
 * as plain objects rather than as request models.
 */
export function reportReplayDrafts(drafts) {
  const valued = [];
  for (const draft of drafts) {
    gate.check(draft);
    valued.push(dump(buildOrder(draft)));
  }
  return valued;
}
