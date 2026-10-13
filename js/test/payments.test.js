import Decimal from 'decimal.js';
import { describe, expect, it } from 'vitest';

import { UpstreamError, ValidationError } from '../src/errors.js';
import { gatewayCharge, gatewayFee, gatewayNet, gatewayRefund } from '../src/payments/gateway.js';
import { reconcileSettlement, reconcileWithRetry } from '../src/payments/reconcile.js';

describe('gateway', () => {
  it('fee is rate plus fixed', () => {
    expect(gatewayFee(new Decimal('100.00'), 'GBP').eq(new Decimal('1.65'))).toBe(true);
  });

  it('fee rounds half up', () => {
    expect(gatewayFee(new Decimal('10.00'), 'EUR').eq(new Decimal('0.40'))).toBe(true);
  });

  it('fee rejects an unsupported currency', () => {
    expect(() => gatewayFee(new Decimal('10.00'), 'JPY')).toThrow(ValidationError);
  });

  it('sek is supported', () => {
    expect(gatewayFee(new Decimal('100.00'), 'SEK').eq(new Decimal('3.95'))).toBe(true);
  });

  it('net is amount less fee', () => {
    expect(gatewayNet(new Decimal('100.00'), 'GBP').eq(new Decimal('98.35'))).toBe(true);
  });

  it('charge rejects a non-positive amount', () => {
    expect(() => gatewayCharge('ada@example.com', new Decimal('0'), 'GBP')).toThrow(
      ValidationError,
    );
  });

  it('charge reports the net', () => {
    const ack = gatewayCharge('ada@example.com', new Decimal('50.00'), 'GBP');
    expect(ack.status).toBe('accepted');
    expect(ack.net).toBe('49.07');
  });

  it('refund keeps the fee', () => {
    const refund = gatewayRefund('ch_1', new Decimal('10.00'), 'GBP');
    expect(refund.fee_returned).toBe('0.00');
  });

  it('refund needs a charge id', () => {
    expect(() => gatewayRefund('', new Decimal('10.00'), 'GBP')).toThrow(UpstreamError);
  });
});

describe('reconcile', () => {
  it('settlement matches when the net agrees', () => {
    const result = reconcileSettlement({
      id: 's1',
      currency: 'GBP',
      gross: '100.00',
      net: '98.35',
    });
    expect(result.matched).toBe(true);
  });

  it('batch reports only the mismatches', () => {
    const mismatches = reconcileWithRetry([
      { id: 's1', currency: 'GBP', gross: '100.00', net: '98.35' },
      { id: 's2', currency: 'GBP', gross: '100.00', net: '90.00' },
    ]);
    expect(mismatches.map((m) => m.settlement_id)).toEqual(['s2']);
  });
});
