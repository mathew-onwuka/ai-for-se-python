# Colony Orders — Python

The FastAPI implementation of the Colony Orders service. The JavaScript port in
[`../js/`](../js/) mirrors it. Both share the HTTP contract in
[`../docs/api.md`](../docs/api.md), the house rules in
[`../docs/conventions.md`](../docs/conventions.md), and the decisions in
[`../docs/adr/`](../docs/adr/).

## Running it

```bash
cd python
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn src.main:app --reload   # http://127.0.0.1:8000
```

## Tests

```bash
pytest
```

## Layout

| Path | What lives there |
|---|---|
| `src/users/` | User records and tiers |
| `src/orders/` | Orders, pricing, the order endpoints |
| `src/payments/` | The live gateway client and daily reconciliation |
| `src/payments_legacy/` | The 2021 fee schedule. Deprecated, not imported |
| `src/exports/` | Scheduled reports. Not on the request path |
| `src/common/` | Config, cache, data access |

Paths above are relative to this `python/` directory.

Read [`../docs/conventions.md`](../docs/conventions.md) before your first change,
and [`../docs/adr/`](../docs/adr/) for the decisions that are not obvious from the
code.
