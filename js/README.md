# Colony Orders — JavaScript

A faithful port of the Python service in [`../python/`](../python/). Same domain, same
HTTP contract (`../docs/api.md`), same house rules (`../docs/conventions.md`)
and architecture decisions (`../docs/adr/`). Express stands in for FastAPI,
Vitest for pytest, [decimal.js](https://mikemcl.github.io/decimal.js/) for
Python's `Decimal`, and [zod](https://zod.dev) for pydantic.

## Running it

```bash
cd js
npm install
cp ../.env.example ../.env   # the same environment variables as the Python app
npm start                    # http://127.0.0.1:8000  (set PORT to change)
```

`npm run dev` reloads on change.

## Tests

```bash
npm test          # vitest run
npm run test:watch
```

## Quality

```bash
npm run lint          # eslint
npm run format        # prettier --write
npm run format:check
```

## Layout

The tree mirrors the Python package, module for module.

| Path                   | What lives there                                   |
| ---------------------- | -------------------------------------------------- |
| `src/users/`           | User records and tiers                             |
| `src/orders/`          | Orders, pricing, the order endpoints               |
| `src/payments/`        | The live gateway client and daily reconciliation   |
| `src/payments_legacy/` | The 2021 fee schedule. Deprecated, not imported    |
| `src/exports/`         | Scheduled reports. Not on the request path         |
| `src/common/`          | Config, cache, data access, logging, HTTP plumbing |

## Notes on the port

- **Money is `Decimal`, never a float** (ADR 0001). Amounts are kept as
  `decimal.js` values and cross the wire as strings at minor-unit precision.
- **Typed errors** (ADR 0003). The `AppError` family in `src/errors.js` maps to
  HTTP status codes in one place, the error handler in `src/main.js`.
- **Thin routers** (ADR 0002). Handlers parse, delegate to one service call,
  and shape the response; error-to-status mapping is central.
- **Field names are snake_case** throughout, so a database row, a request body,
  and a model all share one shape and match `docs/api.md`.
- **The data layer** (`src/common/db.js`) uses Node's built-in `node:sqlite`,
  loaded lazily. It is experimental and needs Node >= 22.5; the test suite never
  touches a real database (see `test/helpers.js`).
- Two functions are intentional starter stubs, matching the Python `...`
  placeholders: `settingsLoad` in `src/common/config.js` and `getOrFetch` in
  `src/common/cache.js`.
