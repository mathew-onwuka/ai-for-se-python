/**
 * Application entry point.
 *
 * Wires the routers, installs the error handler, and registers the default
 * order validators. Nothing else belongs in here.
 */

import express from 'express';
import { ZodError } from 'zod';

import { logger } from './common/logger.js';
import {
  AppError,
  ConflictError,
  NotFoundError,
  UpstreamError,
  ValidationError,
} from './errors.js';
import { router as ordersRouter } from './orders/router.js';
import { NonEmptyLines, RequiredFields } from './protocols.js';
import { router as usersRouter } from './users/router.js';

const STATUS_FOR = new Map([
  [ValidationError, 422],
  [NotFoundError, 404],
  [ConflictError, 409],
  [UpstreamError, 502],
]);

export const VALIDATORS = [
  new RequiredFields('customer_id', 'currency', 'lines'),
  new NonEmptyLines(),
];

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use('/users', usersRouter);
  app.use('/orders', ordersRouter);

  app.get('/health', (req, res) => {
    res.json({ status: 'ok', validators: VALIDATORS.map((v) => v.name) });
  });

  // Error handler. Maps the typed error family to status codes and renders the
  // one error shape documented in docs/api.md. Request-shape failures arrive as
  // ZodError, the equivalent of pydantic's automatic 422.
  // `next` is unused but its presence is what marks this as an error handler.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ZodError) {
      logger.warn(`ValidationError on ${req.path}: request validation failed`);
      return res.status(422).json({
        error: 'ValidationError',
        detail: 'request validation failed',
        context: { issues: err.issues },
      });
    }
    if (err instanceof AppError) {
      const status = STATUS_FOR.get(err.constructor) ?? 500;
      logger.warn(`${err.name} on ${req.path}: ${err}`);
      return res
        .status(status)
        .json({ error: err.name, detail: err.message, context: err.context });
    }
    logger.error(`unhandled error on ${req.path}:`, err);
    return res.status(500).json({ error: 'InternalError', detail: 'internal error', context: {} });
  });

  return app;
}

export const app = createApp();
