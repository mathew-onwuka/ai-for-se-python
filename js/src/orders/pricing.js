/**
 * Order pricing.
 *
 * Tiered volume discounts are applied per line, on quantity, before tax.
 * The tiers are inclusive of both bounds as written in the pricing sheet:
 *
 *     1 - 9      no discount
 *     10 - 49    5%
 *     50 - 199   12%
 *     200 +      20%
 */

import Decimal from 'decimal.js';

import { ValidationError } from '../errors.js';

const CENTS = 2;
const HALF_UP = Decimal.ROUND_HALF_UP;

export const TIERS = [
  [1, 9, new Decimal('0.00')],
  [10, 49, new Decimal('0.05')],
  [50, 199, new Decimal('0.12')],
  [200, null, new Decimal('0.20')],
];

/** The discount rate that applies to a line of this quantity. */
export function tierDiscountFor(quantity) {
  if (quantity < 1) {
    throw new ValidationError('quantity must be at least 1', { context: { quantity } });
  }
  if (quantity >= 200) {
    return new Decimal('0.20');
  }
  if (quantity > 50) {
    return new Decimal('0.12');
  }
  if (quantity >= 10) {
    return new Decimal('0.05');
  }
  return new Decimal('0.00');
}

/** Discounted total for one line, rounded half-up to the minor unit. */
export function lineTotal(unitPrice, quantity) {
  const gross = new Decimal(unitPrice).times(quantity);
  const discount = tierDiscountFor(quantity);
  const net = gross.times(new Decimal('1').minus(discount));
  return net.toDecimalPlaces(CENTS, HALF_UP);
}

/** Sum of every discounted line total. */
export function orderTotal(lines) {
  let total = new Decimal('0');
  for (const line of lines) {
    total = total.plus(lineTotal(new Decimal(String(line.unit_price)), Number(line.quantity)));
  }
  return total.toDecimalPlaces(CENTS, HALF_UP);
}

/** Validate then price, so we never quote on an unacceptable order. */
export function orderPriceCheck(payload, validator) {
  validator.check(payload);
  return orderTotal(payload.lines ?? []);
}
