import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../src/errors.js';
import { lineTotal, orderTotal, tierDiscountFor } from '../src/orders/pricing.js';

describe('pricing', () => {
  it.each([
    [1, '0.00'],
    [9, '0.00'],
    [10, '0.05'],
    [49, '0.05'],
    [199, '0.12'],
    [200, '0.20'],
    [5000, '0.20'],
  ])('tier discount for a quantity of %i is %s', (quantity, expected) => {
    expect(tierDiscountFor(quantity).eq(new Decimal(expected))).toBe(true);
  });

  it('rejects a quantity below one', () => {
    expect(() => tierDiscountFor(0)).toThrow(ValidationError);
  });

  it('line total applies the discount', () => {
    expect(lineTotal(new Decimal('10.00'), 10).eq(new Decimal('95.00'))).toBe(true);
  });

  it('line total rounds half up', () => {
    expect(lineTotal(new Decimal('3.335'), 1).eq(new Decimal('3.34'))).toBe(true);
  });

  it('order total sums the lines', () => {
    const lines = [
      { sku: 'a', quantity: 2, unit_price: '5.00' },
      { sku: 'b', quantity: 10, unit_price: '1.00' },
    ];
    expect(orderTotal(lines).eq(new Decimal('19.50'))).toBe(true);
  });
});
