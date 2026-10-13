# Colony Orders

Orders, users, and payment reconciliation for the Colony storefront.

This repository ships the same service in two languages. Both share the HTTP
contract in `docs/api.md`, the house rules in `docs/conventions.md`, and the
decisions in `docs/adr/`.

- **Python** (FastAPI) — in `src/` and `tests/` at the repository root.
- **JavaScript** (Express) — in `js/`. See `js/README.md`.

Pick whichever you are working in; they are kept in step with each other.

## Python

### Running it

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.main:app --reload
```

### Tests

```bash
pytest
```

## JavaScript

```bash
cd js
npm install
npm test
npm start
```

Full details in `js/README.md`.

## Layout (Python)

| Path | What lives there |
|---|---|
| `src/users/` | User records and tiers |
| `src/orders/` | Orders, pricing, the order endpoints |
| `src/payments/` | The live gateway client and daily reconciliation |
| `src/payments_legacy/` | The 2021 fee schedule. Deprecated, not imported |
| `src/exports/` | Scheduled reports. Not on the request path |
| `src/common/` | Config, cache, data access |

Read `docs/conventions.md` before your first change, and `docs/adr/` for the
decisions that are not obvious from the code.
