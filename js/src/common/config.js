/**
 * Runtime settings.
 *
 * Settings are read once at startup and treated as immutable afterwards.
 */

const DEFAULT_CURRENCIES = Object.freeze(['GBP', 'EUR', 'USD']);

/**
 * Build Settings from the process environment.
 *
 * Throws for anything that has no safe default.
 */
export function settingsFromEnv() {
  const require = (key) => {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`missing required environment variable: ${key}`);
    }
    return value;
  };

  return Object.freeze({
    databaseUrl: require('DATABASE_URL'),
    gatewayUrl: require('GATEWAY_URL'),
    gatewayTimeoutS: Number(process.env.GATEWAY_TIMEOUT_S ?? '5.0'),
    cacheTtlS: Number.parseInt(process.env.CACHE_TTL_S ?? '300', 10),
    supportedCurrencies: DEFAULT_CURRENCIES,
    environment: process.env.ENVIRONMENT ?? 'local',
  });
}

// eslint-disable-next-line no-unused-vars -- `path` is read once this stub is finished
export function settingsLoad(path) {
  // TODO: parse the config
}

/** A dict safe to log: credentials stripped from any URL. */
export function settingsRedacted(settings) {
  const strip = (url) => {
    if (!url.includes('@')) {
      return url;
    }
    const [scheme, rest = ''] = url.split('://');
    const host = rest.slice(rest.lastIndexOf('@') + 1);
    return `${scheme}://***@${host}`;
  };

  return {
    databaseUrl: strip(settings.databaseUrl),
    gatewayUrl: strip(settings.gatewayUrl),
    environment: settings.environment,
    cacheTtlS: settings.cacheTtlS,
  };
}
