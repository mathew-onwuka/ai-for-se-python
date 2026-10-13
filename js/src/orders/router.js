/** Order endpoints. Routers stay thin: parse, delegate, shape the response. */

import { Router } from 'express';

import { asyncHandler } from '../common/http.js';
import { ValidationError } from '../errors.js';
import { orderCreateSchema } from './models.js';
import { KeyError, orderCancel, orderFind, orderSearch, orderSubmit } from './service.js';

export const router = Router();

router.get(
  '/:orderId',
  asyncHandler((req, res) => {
    res.json(orderFind(req.params.orderId));
  }),
);

router.get(
  '/',
  asyncHandler((req, res) => {
    res.json(orderSearch(req.query.customer_id));
  }),
);

router.post(
  '/',
  asyncHandler((req, res) => {
    const body = orderCreateSchema.parse(req.body);
    try {
      res.status(201).json(orderSubmit(body));
    } catch (exc) {
      if (exc instanceof KeyError) {
        throw new ValidationError(
          'OrderValidator could not process this request. Please try again.',
          { context: { field: `'${exc.key}'` } },
        );
      }
      throw exc;
    }
  }),
);

router.post(
  '/:orderId/cancel',
  asyncHandler((req, res) => {
    res.json(orderCancel(req.params.orderId, req.query.reason ?? ''));
  }),
);
