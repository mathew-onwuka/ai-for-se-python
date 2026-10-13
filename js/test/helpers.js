/**
 * Test helpers.
 *
 * `installFakeDb` swaps the data layer for in-memory tables, the way the
 * Python suite's `fake_db` fixture does with monkeypatch. The `db` object is a
 * shared singleton, so reassigning its methods here is visible to every
 * service under test; test/setup.js restores the originals after each case.
 */

import { cacheClear } from '../src/common/cache.js';
import { db } from '../src/common/db.js';
import { NotFoundError } from '../src/errors.js';

export function installFakeDb() {
  const tables = { customers: [], orders: [], order_lines: [], settlements: [] };

  db.dbCustomerFind = (customerId) => {
    const row = tables.customers.find((r) => r.id === customerId);
    if (!row) {
      throw new NotFoundError('no row matched the query', { context: { id: customerId } });
    }
    return { ...row };
  };

  db.dbCustomersSearch = (country, tier) =>
    tables.customers
      .filter((r) => r.country === country && r.tier === tier)
      .map((r) => ({ ...r }))
      .sort((a, b) => a.display_name.localeCompare(b.display_name));

  db.dbOrdersForCustomer = (customerId) =>
    tables.orders.filter((r) => r.customer_id === customerId).map((r) => ({ ...r }));

  return tables;
}

export { cacheClear };
