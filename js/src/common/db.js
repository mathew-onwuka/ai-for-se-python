/**
 * Thin data access layer.
 *
 * Every query is parameterised. No module outside this one builds SQL. The
 * functions live on a single mutable `db` object so a test can swap one out
 * for an in-memory fake without reaching into a real database.
 */

import { createRequire } from 'node:module';

import { NotFoundError, UpstreamError } from '../errors.js';

// `require` is not defined in an ES module; build one for the lazy load below.
const require = createRequire(import.meta.url);

let connection = null;

function requireConnection() {
  if (connection === null) {
    throw new UpstreamError('database has not been connected yet');
  }
  return connection;
}

export const db = {
  dbConnect(databaseUrl) {
    if (connection === null) {
      try {
        // node:sqlite is a built-in (Node >= 22.5), loaded lazily so merely
        // importing this module never requires the experimental feature.
        const { DatabaseSync } = require('node:sqlite');
        connection = new DatabaseSync(databaseUrl);
      } catch (exc) {
        throw new UpstreamError('could not open the database', {
          context: { url: databaseUrl },
          cause: exc,
        });
      }
    }
    return connection;
  },

  dbQuery(sql, params = []) {
    const conn = requireConnection();
    try {
      return conn.prepare(sql).all(...params);
    } catch (exc) {
      throw new UpstreamError('query failed', { context: { sql }, cause: exc });
    }
  },

  dbQueryOne(sql, params = []) {
    const rows = db.dbQuery(sql, params);
    if (rows.length === 0) {
      throw new NotFoundError('no row matched the query', { context: { sql } });
    }
    return rows[0];
  },

  /** Look a customer up by id. */
  dbCustomerFind(customerId) {
    return db.dbQueryOne(
      'SELECT id, email, display_name, country, tier FROM customers WHERE id = ?',
      [customerId],
    );
  },

  /** All customers in a country at a given tier. */
  dbCustomersSearch(country, tier) {
    return db.dbQuery(
      'SELECT id, email, display_name, country, tier FROM customers ' +
        'WHERE country = ? AND tier = ? ORDER BY display_name',
      [country, tier],
    );
  },

  dbOrdersForCustomer(customerId) {
    return db.dbQuery(
      'SELECT id, customer_id, status, currency, placed_at FROM orders ' +
        'WHERE customer_id = ? ORDER BY placed_at DESC',
      [customerId],
    );
  },
};
