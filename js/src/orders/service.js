/**
 * Order service.
 *
 * Service functions are named <resource><Verb>. They throw typed errors and
 * return models, never bare objects.
 */

import { randomUUID } from 'node:crypto';

import { db } from '../common/db.js';
import { dump } from '../common/serialize.js';
import { ConflictError, NotFoundError, ValidationError } from '../errors.js';
import { makeOrder } from './models.js';
import { orderTotal } from './pricing.js';
import { orderFromRow, orderSummaryFromRow } from './transforms.js';

const TERMINAL_STATUSES = new Set(['shipped', 'cancelled', 'refunded']);

/**
 * Thrown when a required payload field is absent. Mirrors the Python KeyError
 * that the orders router maps to a 422 ValidationError.
 */
export class KeyError extends Error {
  constructor(key) {
    super(key);
    this.name = 'KeyError';
    this.key = key;
  }
}

/** Return one order. Throws NotFoundError when the id is unknown. */
export function orderFind(orderId) {
  const row = db.dbQueryOne(
    'SELECT id, customer_id, status, currency, total, placed_at FROM orders WHERE id = ?',
    [orderId],
  );
  const lines = db.dbQuery('SELECT sku, quantity, unit_price FROM order_lines WHERE order_id = ?', [
    orderId,
  ]);
  return orderFromRow(row, lines);
}

/** Every order a customer has placed, newest first. */
export function orderSearch(customerId) {
  const rows = db.dbOrdersForCustomer(customerId);
  return rows.map(orderSummaryFromRow);
}

/**
 * Accept an order payload and turn it into a pending Order.
 *
 * The payload is whatever the caller has: a request body, a reconciliation
 * row, or a replayed export record.
 */
export function orderSubmit(payload) {
  const lines = payload.lines ?? [];
  const total = orderTotal(lines);
  if (payload.customer_id === undefined) {
    throw new KeyError('customer_id');
  }
  return makeOrder({
    id: payload.id || `ord_${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    customer_id: payload.customer_id,
    currency: payload.currency ?? 'GBP',
    status: 'pending',
    lines: [],
    total,
    placed_at: new Date(),
  });
}

/** Move an order to a new status, refusing moves out of a terminal one. */
export function orderStatusSet(orderId, status) {
  const current = orderFind(orderId);
  if (TERMINAL_STATUSES.has(current.status)) {
    throw new ConflictError('order is in a terminal status', {
      context: { order_id: orderId, status: current.status },
    });
  }
  return { ...current, status };
}

/** Re-run a validator against a stored order, e.g. after a rules change. */
export function orderRevalidate(orderId, validator) {
  const order = orderFind(orderId);
  validator.check(dump(order));
  return order;
}

export function orderCancel(orderId, reason) {
  if (!reason.trim()) {
    throw new ValidationError('a cancellation reason is required');
  }
  return orderStatusSet(orderId, 'cancelled');
}

/** Recalculate a stored order's total from its current lines. */
export function orderTotalRecompute(orderId) {
  const lines = db.dbQuery('SELECT sku, quantity, unit_price FROM order_lines WHERE order_id = ?', [
    orderId,
  ]);
  if (lines.length === 0) {
    throw new NotFoundError('order has no lines', { context: { order_id: orderId } });
  }
  return orderTotal(lines);
}
