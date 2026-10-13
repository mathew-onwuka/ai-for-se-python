/**
 * JSON serialisation helpers.
 *
 * The Python service returns pydantic models and calls `.model_dump(mode="json")`
 * when a caller needs a plain dict. `dump` is the direct equivalent: it walks
 * a model object and returns a JSON-safe plain object. Decimals (decimal.js)
 * and Dates both already define `toJSON`, so they serialise to strings exactly
 * as they cross the wire.
 */

export function dump(model) {
  return JSON.parse(JSON.stringify(model));
}
