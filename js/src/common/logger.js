/**
 * A deliberately small logger.
 *
 * The house rule (docs/conventions.md) is: use a logger, never bare `print`.
 * JavaScript has no standard logging module, so this wraps `console` behind one
 * named channel — the counterpart to Python's `logging.getLogger("app")`. Log
 * lines are lower case and do not end in a full stop. Never log a value that
 * came from settings without passing it through `settingsRedacted` first.
 */

export const logger = {
  warn: (...args) => console.warn('[app]', ...args),
  error: (...args) => console.error('[app]', ...args),
  info: (...args) => console.info('[app]', ...args),
};
