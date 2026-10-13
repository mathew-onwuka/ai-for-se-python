/** Daily reconciliation of processor settlements against our own orders. */

import Decimal from 'decimal.js';

import { db } from '../common/db.js';
import { dump } from '../common/serialize.js';
import { UpstreamError } from '../errors.js';
import { orderSubmit } from '../orders/service.js';
import { RequiredFields } from '../protocols.js';
import { gatewayFee, gatewayNet } from './gateway.js';

const TOLERANCE = new Decimal('0.01');
const checker = new RequiredFields('customer_id', 'lines');

/** Compare one settlement line against what we think we charged. */
export function reconcileSettlement(settlement) {
  const expectedNet = gatewayNet(new Decimal(String(settlement.gross)), settlement.currency);
  const actualNet = new Decimal(String(settlement.net));
  const delta = actualNet.minus(expectedNet).abs();
  return {
    settlement_id: settlement.id,
    expected_net: expectedNet.toFixed(2),
    actual_net: actualNet.toFixed(2),
    fee: gatewayFee(new Decimal(String(settlement.gross)), settlement.currency).toFixed(2),
    matched: delta.lte(TOLERANCE),
  };
}

/** Reconcile a batch of settlements and report the mismatches. */
export function reconcileWithRetry(settlements) {
  const results = settlements.map(reconcileSettlement);
  return results.filter((r) => !r.matched);
}

/**
 * Rebuild orders from settlement rows we hold but never turned into orders.
 *
 * Used after an outage, when the processor accepted charges that our own
 * write path dropped.
 */
export function reconcileReplay(day) {
  const rows = db.dbQuery(
    'SELECT id, customer_id, currency, gross, payload_lines FROM settlements ' +
      'WHERE settled_on = ? AND order_id IS NULL',
    [day],
  );
  if (rows.length === 0) {
    return [];
  }

  const rebuilt = [];
  for (const row of rows) {
    const record = {
      id: row.id,
      customer_id: row.customer_id,
      currency: row.currency,
      lines: row.payload_lines ?? [],
    };
    checker.check(record);
    rebuilt.push(dump(orderSubmit(record)));
  }
  return rebuilt;
}

export function reconcileDay(day) {
  const rows = db.dbQuery('SELECT id, currency, gross, net FROM settlements WHERE settled_on = ?', [
    day,
  ]);
  if (rows.length === 0) {
    throw new UpstreamError('no settlement file for that day', { context: { day } });
  }
  const mismatches = reconcileWithRetry(rows);
  return { day, checked: rows.length, mismatched: mismatches.length };
}
