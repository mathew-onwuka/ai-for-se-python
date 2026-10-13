/**
 * Application error hierarchy.
 *
 * Every failure that crosses a module boundary is raised as one of these.
 * See docs/adr/0003-typed-exceptions.md for the reasoning.
 */

export class AppError extends Error {
  /** Base for all application errors. Never throw this directly. */
  constructor(message, { context = {} } = {}) {
    super(message);
    this.name = new.target.name;
    this.message = message;
    this.context = context;
  }

  toString() {
    const keys = Object.keys(this.context);
    if (keys.length === 0) {
      return this.message;
    }
    const detail = keys
      .sort()
      .map((k) => `${k}=${JSON.stringify(this.context[k])}`)
      .join(', ');
    return `${this.message} (${detail})`;
  }
}

/** A requested entity does not exist. */
export class NotFoundError extends AppError {}

/** Input failed a business rule or a shape check. */
export class ValidationError extends AppError {}

/** A dependency we do not own failed or answered unusably. */
export class UpstreamError extends AppError {}

/** The request is well formed but conflicts with current state. */
export class ConflictError extends AppError {}
