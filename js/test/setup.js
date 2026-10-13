/**
 * Global test setup.
 *
 * Clears the in-process cache around every test and restores the data-access
 * singleton after each one, so a fake installed by installFakeDb never leaks
 * into the next case. This is the Vitest equivalent of tests/conftest.py.
 */

import { afterEach, beforeEach } from 'vitest';

import { cacheClear } from '../src/common/cache.js';
import { db } from '../src/common/db.js';

const originalDb = { ...db };

beforeEach(() => {
  cacheClear();
});

afterEach(() => {
  Object.assign(db, originalDb);
  cacheClear();
});
