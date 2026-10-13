/**
 * Order models.
 *
 * Field names are snake_case to match the HTTP contract in docs/api.md and the
 * database columns, so a row, a request body, and a model all share one shape.
 */

import { z } from 'zod';
import Decimal from 'decimal.js';

/** A money amount: accepts a JSON string or number, never a float downstream. */
const money = z
  .union([z.string(), z.number()])
  .transform((v) => new Decimal(v))
  .refine((d) => d.isFinite(), { message: 'not a valid amount' });

export const orderLineSchema = z.object({
  sku: z.string().min(1),
  quantity: z.number().int().gt(0),
  unit_price: money.refine((d) => d.gte(0), { message: 'unit_price must be >= 0' }),
});

export const orderCreateSchema = z.object({
  customer_id: z.string().min(1),
  currency: z.string().length(3),
  lines: z.array(orderLineSchema).min(1),
  note: z.string().nullish(),
});

/** Build an internal Order model. Mirrors the pydantic Order defaults. */
export function makeOrder({
  id,
  customer_id,
  currency,
  status = 'pending',
  lines = [],
  total = new Decimal(0),
  placed_at = null,
}) {
  return {
    id,
    customer_id,
    currency,
    status,
    lines,
    total: new Decimal(total),
    placed_at,
    // Money crosses the wire as a string at minor-unit precision (ADR 0001).
    toJSON() {
      return {
        id: this.id,
        customer_id: this.customer_id,
        currency: this.currency,
        status: this.status,
        lines: this.lines,
        total: this.total.toFixed(2),
        placed_at: this.placed_at,
      };
    },
  };
}

export function makeOrderLine({ sku, quantity, unit_price }) {
  return {
    sku,
    quantity,
    unit_price: new Decimal(unit_price),
    toJSON() {
      return { sku: this.sku, quantity: this.quantity, unit_price: this.unit_price.toFixed(2) };
    },
  };
}

export function makeOrderSummary({ id, customer_id, status, currency, total }) {
  return {
    id,
    customer_id,
    status,
    currency,
    total: new Decimal(total),
    toJSON() {
      return {
        id: this.id,
        customer_id: this.customer_id,
        status: this.status,
        currency: this.currency,
        total: this.total.toFixed(2),
      };
    },
  };
}
