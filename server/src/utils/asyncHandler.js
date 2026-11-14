/**
 * @file asyncHandler.js
 * @description Higher-order middleware utility to wrap asynchronous Express route handlers.
 * Catches unhandled Promise rejections and passes them to the next error middleware,
 * eliminating verbose try-catch blocks across route definitions.
 */

/**
 * Wraps an async route handler function to automatically catch errors and delegate to next(err).
 *
 * @param {Function} fn - Asynchronous Express route handler (req, res, next) => Promise<any>
 * @returns {Function} Express middleware handler
 */
export default function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
