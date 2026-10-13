/**
 * Structural interfaces shared across packages.
 *
 * These are duck-typed roles, not base classes: implementations do not import
 * from here, only the call sites do. An OrderValidator is anything with a
 * `name` string and a `check(payload)` method that throws ValidationError and
 * never returns a bool. A RecordSource is anything with a `fetch(recordId)`
 * method returning a record or null.
 */

import { ValidationError } from './errors.js';

/** Default OrderValidator: every listed key must be present and truthy. */
export class RequiredFields {
  constructor(...fields) {
    this.name = 'required-fields';
    this._fields = fields;
  }

  /** Throw ValidationError if any required field is missing or falsy. */
  check(payload) {
    const missing = this._fields.filter((f) => !payload[f]);
    if (missing.length > 0) {
      throw new ValidationError('order is missing required fields', {
        context: { missing },
      });
    }
  }
}

/** Default OrderValidator: an order must contain at least one line. */
export class NonEmptyLines {
  constructor() {
    this.name = 'non-empty-lines';
  }

  /** Throw ValidationError if the order carries no lines. */
  check(payload) {
    const lines = payload.lines || [];
    if (lines.length === 0) {
      throw new ValidationError('order must contain at least one line');
    }
  }
}
