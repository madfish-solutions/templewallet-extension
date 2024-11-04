type ProcessDotEnv = {
  NODE_ENV: 'development' | 'production' | 'test';
  TARGET_BROWSER: string;
  SOURCE_MAP?: `${boolean}`;
  IMAGE_INLINE_SIZE_LIMIT?: string;
  CORE_BUILD?: `${boolean}`;
};

const {
  NODE_ENV = 'development',
  TARGET_BROWSER = 'chrome',
  SOURCE_MAP: SOURCE_MAP_ENV,
  IMAGE_INLINE_SIZE_LIMIT: IMAGE_INLINE_SIZE_LIMIT_ENV = '10000',
  CORE_BUILD
} = process.env as ProcessDotEnv;

export const WEBPACK_MODE = NODE_ENV === 'test' ? 'none' : NODE_ENV;

export const DEVELOPMENT_ENV = NODE_ENV === 'development';
export const PRODUCTION_ENV = NODE_ENV === 'production';

export const SOURCE_MAP = NODE_ENV !== 'production' && SOURCE_MAP_ENV !== 'false';

export const DROP_CONSOLE_IN_PROD = true;

export const IS_CORE_BUILD = CORE_BUILD === 'true';

export const RELOADER_PORTS = {
  BACKGROUND: 9090,
  SCRIPTS: 9091,
  PAGES: 9092
};

export const ALL_VENDORS = ['chrome', 'brave', 'firefox', 'opera'] as const;

export type Vendor = (typeof ALL_VENDORS)[number];

const MANIFEST_VERSION_BY_VENDORS: Record<Vendor, 2 | 3> = {
  chrome: 3,
  brave: 3,
  firefox: 2,
  opera: 3
};

export const getManifestVersion = (vendor: string) => MANIFEST_VERSION_BY_VENDORS[vendor as Vendor] || 2;

export const MANIFEST_VERSION = getManifestVersion(TARGET_BROWSER);
export const BACKGROUND_IS_WORKER = MANIFEST_VERSION === 3;

/** Firefox limitation of 4MB per chunk */
export const MAX_JS_CHUNK_SIZE_IN_BYTES = 4_000_000;

export { NODE_ENV, TARGET_BROWSER, IMAGE_INLINE_SIZE_LIMIT_ENV };
