// DEPRECATED - superseded by js/src/payments/reconcile.js in the 2024 fee migration.
// Kept only until the 2023 settlement archive is re-exported. Do not import.
/** Daily reconciliation of processor settlements against our own orders. */

import Decimal from 'decimal.js';

import { db } from '../common/db.js';
import { UpstreamError } from '../errors.js';
import { gatewayFee, gatewayNet } from './gateway.js';

const TOLERANCE = new Decimal('0.05');

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
