import Decimal from 'decimal.js';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../src/errors.js';
import { app } from '../src/main.js';
import { orderCreateSchema, orderLineSchema } from '../src/orders/models.js';
import { orderSearch } from '../src/orders/service.js';
import { orderSummaryFromRow } from '../src/orders/transforms.js';
import { NonEmptyLines, RequiredFields } from '../src/protocols.js';
import { installFakeDb } from './helpers.js';

describe('orders over HTTP', () => {
  it('create order returns a pending order', async () => {
    const response = await request(app)
      .post('/orders')
      .send({
        customer_id: 'ada@example.com',
        currency: 'GBP',
        lines: [{ sku: 'a', quantity: 1, unit_price: '5.00' }],
      });
    expect(response.status).toBe(201);
    expect(response.body.status).toBe('pending');
    expect(response.body.customer_id).toBe('ada@example.com');
    expect(response.body.id.startsWith('ord_')).toBe(true);
  });

  it('create order prices the lines', async () => {
    const response = await request(app)
      .post('/orders')
      .send({
        customer_id: 'ada@example.com',
        currency: 'GBP',
        lines: [{ sku: 'a', quantity: 2, unit_price: '7.50' }],
      });
    expect(new Decimal(response.body.total).eq(new Decimal('15.00'))).toBe(true);
  });

  it('create order applies the volume discount', async () => {
    const response = await request(app)
      .post('/orders')
      .send({
        customer_id: 'ada@example.com',
        currency: 'GBP',
        lines: [{ sku: 'a', quantity: 10, unit_price: '10.00' }],
      });
    expect(new Decimal(response.body.total).eq(new Decimal('95.00'))).toBe(true);
  });
});

describe('orders', () => {
  it('search returns summaries', () => {
    const db = installFakeDb();
    db.orders.push({
      id: 'ord_1',
      customer_id: 'ada@example.com',
      status: 'pending',
      currency: 'GBP',
      total: '10.00',
      placed_at: null,
    });
    const summaries = orderSearch('ada@example.com');
    expect(summaries.map((s) => s.id)).toEqual(['ord_1']);
  });

  it('summary transform defaults the status', () => {
    const summary = orderSummaryFromRow({
      id: 'ord_2',
      customer_id: 'c',
      currency: 'GBP',
      total: '1.00',
    });
    expect(summary.status).toBe('pending');
  });

  it('order create rejects an empty line list', () => {
    expect(() =>
      orderCreateSchema.parse({ customer_id: 'c', currency: 'GBP', lines: [] }),
    ).toThrow();
  });

  it('order line rejects a zero quantity', () => {
    expect(() => orderLineSchema.parse({ sku: 'a', quantity: 0, unit_price: '1' })).toThrow();
  });

  it('required fields validator names what is missing', () => {
    try {
      new RequiredFields('customer_id', 'lines').check({ customer_id: 'c' });
      throw new Error('expected ValidationError');
    } catch (exc) {
      expect(exc).toBeInstanceOf(ValidationError);
      expect(exc.context.missing).toEqual(['lines']);
    }
  });

  it('non-empty lines validator rejects an empty order', () => {
    expect(() => new NonEmptyLines().check({ customer_id: 'c', lines: [] })).toThrow(
      ValidationError,
    );
  });
});
