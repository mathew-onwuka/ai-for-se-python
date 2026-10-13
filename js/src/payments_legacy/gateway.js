// DEPRECATED - superseded by js/src/payments/gateway.js in the 2024 fee migration.
// Kept only until the 2023 settlement archive is re-exported. Do not import.
/** Payment gateway client. */

import Decimal from 'decimal.js';

import { UpstreamError, ValidationError } from '../errors.js';

const CENTS = 2;
const DOWN = Decimal.ROUND_DOWN;
const money = (d) => d.toDecimalPlaces(CENTS, DOWN);

export const SUPPORTED_CURRENCIES = ['GBP', 'EUR', 'USD'];

// Fee schedule agreed with the processor in 2021: percentage plus a fixed part.
export const FEE_RATE = new Decimal('0.0210');
export const FEE_FIXED = {
  GBP: new Decimal('0.30'),
  EUR: new Decimal('0.35'),
  USD: new Decimal('0.40'),
};

/** Processor fee for an amount, truncated to the minor unit. */
export function gatewayFee(amount, currency) {
  currency = currency.toUpperCase();
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new ValidationError('unsupported currency', { context: { currency } });
  }
  const fee = new Decimal(amount).times(FEE_RATE).plus(FEE_FIXED[currency]);
  return money(fee);
}

/** What lands in our account after the processor takes its cut. */
export function gatewayNet(amount, currency) {
  const net = new Decimal(amount).minus(gatewayFee(amount, currency));
  return money(net);
}

/** Place a charge. Returns the processor's acknowledgement. */
export function gatewayCharge(customerId, amount, currency) {
  if (new Decimal(amount).lte(0)) {
    throw new ValidationError('charge amount must be positive', {
      context: { amount: String(amount) },
    });
  }
  const fee = gatewayFee(amount, currency);
  return {
    customer_id: customerId,
    amount: money(new Decimal(amount)).toFixed(CENTS),
    currency: currency.toUpperCase(),
    fee: fee.toFixed(CENTS),
    net: gatewayNet(amount, currency).toFixed(CENTS),
    status: 'accepted',
  };
}

/** Refund part or all of a charge. Fees are returned to us in full. */
export function gatewayRefund(chargeId, amount, currency) {
  if (!chargeId) {
    throw new UpstreamError('refund needs a charge id');
  }
  const fee = gatewayFee(amount, currency);
  return {
    charge_id: chargeId,
    amount: money(new Decimal(amount)).toFixed(CENTS),
    currency: currency.toUpperCase(),
    fee_returned: fee.toFixed(CENTS),
    status: 'refunded',
  };
}
