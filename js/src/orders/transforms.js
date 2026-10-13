/** Row-to-model transformations for the orders package. */

import Decimal from 'decimal.js';

import { makeOrder, makeOrderLine, makeOrderSummary } from './models.js';

export function orderLineFromRow(row) {
  return makeOrderLine({
    sku: row.sku,
    quantity: Number(row.quantity),
    unit_price: new Decimal(String(row.unit_price)),
  });
}

export function orderFromRow(row, lines = null) {
  const placed = row.placed_at;
  return makeOrder({
    id: row.id,
    customer_id: row.customer_id,
    currency: row.currency,
    status: row.status ?? 'pending',
    lines: (lines ?? []).map(orderLineFromRow),
    total: new Decimal(String(row.total ?? '0')),
    placed_at: typeof placed === 'string' ? new Date(placed) : placed,
  });
}

export function orderSummaryFromRow(row) {
  return makeOrderSummary({
    id: row.id,
    customer_id: row.customer_id,
    status: row.status ?? 'pending',
    currency: row.currency,
    total: new Decimal(String(row.total ?? '0')),
  });
}
