/**
 * Dev server entry point.
 *
 * `main.js` builds and exports the app, the way `uvicorn src.main:app` expects
 * one on the Python side. This file is the thing you actually run.
 */

import { logger } from './common/logger.js';
import { app } from './main.js';

const port = Number.parseInt(process.env.PORT ?? '8000', 10);

app.listen(port, () => {
  logger.info(`colony-orders listening on http://127.0.0.1:${port}`);
});
