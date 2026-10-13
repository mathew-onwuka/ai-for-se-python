/**
 * HTTP plumbing shared by the routers.
 *
 * `asyncHandler` forwards any thrown error to the Express error middleware, so
 * routers never write their own try/catch: they parse, delegate to one service
 * call, and shape the response. Error-to-status mapping lives in one place,
 * the error handler installed in main.js.
 */

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
