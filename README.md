# Colony Orders

Orders, users, and payment reconciliation for the Colony storefront.

The service is shipped in two languages. Both implement the same domain against
one shared contract, so you can work in whichever you prefer and expect the same
behaviour.

- **Python** (FastAPI) — in [`python/`](python/). See [`python/README.md`](python/README.md).
- **JavaScript** (Express) — in [`js/`](js/). See [`js/README.md`](js/README.md).

## Repository layout

```
.
├── python/        FastAPI implementation  (src/, tests/, pyproject.toml)
├── js/            Express implementation  (src/, test/, package.json)
├── docs/          Shared, language-neutral docs: API contract, conventions, ADRs
├── .env.example   Shared runtime configuration (copy to .env)
└── reset-demo.sh  Demo reset tooling
```

The two implementations are kept in step with each other. Anything that is true
of both — the HTTP contract, the house rules, the decisions behind the design —
lives once in [`docs/`](docs/), not twice.

## Python (FastAPI)

```bash
cd python
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn src.main:app --reload   # http://127.0.0.1:8000
pytest
```

More detail in [`python/README.md`](python/README.md).

## JavaScript (Express)

```bash
cd js
npm install
cp ../.env.example ../.env
npm start                        # http://127.0.0.1:8000
npm test
```

More detail in [`js/README.md`](js/README.md).

## Documentation

- [`docs/api.md`](docs/api.md) — the HTTP API, identical across both implementations.
- [`docs/conventions.md`](docs/conventions.md) — house rules. Read this before your first change.
- [`docs/adr/`](docs/adr/) — the architecture decisions that are not obvious from the code.
