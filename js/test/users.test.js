import { describe, expect, it } from 'vitest';

import { ConflictError, NotFoundError, ValidationError } from '../src/errors.js';
import { userCreate, userFind, userSearch, userTierSet } from '../src/users/service.js';
import { userDisplayNameNormalise } from '../src/users/transforms.js';
import { installFakeDb } from './helpers.js';

describe('users', () => {
  it('find returns a user', () => {
    const db = installFakeDb();
    db.customers.push({
      id: 'ada@example.com',
      email: 'ada@example.com',
      display_name: 'Ada',
      country: 'GB',
      tier: 'standard',
    });
    const user = userFind('ada@example.com');
    expect(user.display_name).toBe('Ada');
    expect(user.country).toBe('GB');
  });

  it('find with an unknown id raises not found', () => {
    installFakeDb();
    expect(() => userFind('nobody@example.com')).toThrow(NotFoundError);
  });

  it('find requires an id', () => {
    installFakeDb();
    expect(() => userFind('')).toThrow(ValidationError);
  });

  it('search normalises the country code', () => {
    const db = installFakeDb();
    db.customers.push({
      id: 'b@example.com',
      email: 'b@example.com',
      display_name: 'Bea',
      country: 'GB',
      tier: 'standard',
    });
    expect(userSearch('gb')).toHaveLength(1);
  });

  it('search rejects a long country code', () => {
    installFakeDb();
    expect(() => userSearch('GBR')).toThrow(ValidationError);
  });

  it('create lowercases the email', () => {
    installFakeDb();
    const user = userCreate({ email: 'Grace@Example.com', display_name: 'Grace', country: 'us' });
    expect(user.email).toBe('grace@example.com');
    expect(user.country).toBe('US');
  });

  it('create rejects a blocked domain', () => {
    installFakeDb();
    expect(() =>
      userCreate({ email: 'x@mailinator.com', display_name: 'X', country: 'GB' }),
    ).toThrow(ValidationError);
  });

  it('create rejects a duplicate', () => {
    const db = installFakeDb();
    db.customers.push({
      id: 'ada@example.com',
      email: 'ada@example.com',
      display_name: 'Ada',
      country: 'GB',
      tier: 'standard',
    });
    expect(() =>
      userCreate({ email: 'ada@example.com', display_name: 'Ada', country: 'GB' }),
    ).toThrow(ConflictError);
  });

  it('tier set rejects an unknown tier', () => {
    installFakeDb();
    expect(() => userTierSet('ada@example.com', 'platinum')).toThrow(ValidationError);
  });

  it('display name normalisation collapses whitespace', () => {
    expect(userDisplayNameNormalise('  Ada   Lovelace ')).toBe('Ada Lovelace');
  });
});
