/** User endpoints. Routers stay thin: parse, delegate, shape the response. */

import { Router } from 'express';

import { asyncHandler } from '../common/http.js';
import { userCreateSchema } from './models.js';
import { userCreate, userFind, userSearch, userTierSet } from './service.js';

export const router = Router();

router.get(
  '/:userId',
  asyncHandler((req, res) => {
    res.json(userFind(req.params.userId));
  }),
);

router.get(
  '/',
  asyncHandler((req, res) => {
    res.json(userSearch(req.query.country, req.query.tier ?? 'standard'));
  }),
);

router.post(
  '/',
  asyncHandler((req, res) => {
    const payload = userCreateSchema.parse(req.body);
    res.status(201).json(userCreate(payload));
  }),
);

router.put(
  '/:userId/tier',
  asyncHandler((req, res) => {
    res.json(userTierSet(req.params.userId, req.query.tier));
  }),
);
