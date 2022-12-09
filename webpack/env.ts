type ProcessDotEnv = {
  NODE_ENV: 'development' | 'production' | 'test';
  TARGET_BROWSER: string;
  SOURCE_MAP?: 'true' | 'false';
  IMAGE_INLINE_SIZE_LIMIT?: string;
};

const {
  NODE_ENV = 'development',
  TARGET_BROWSER = 'chrome',
  SOURCE_MAP: SOURCE_MAP_ENV,
  IMAGE_INLINE_SIZE_LIMIT: IMAGE_INLINE_SIZE_LIMIT_ENV = '10000'
} = process.env as ProcessDotEnv;

const WEBPACK_MODE = NODE_ENV === 'test' ? 'none' : NODE_ENV;

const DEVELOPMENT_ENV = NODE_ENV === 'development';
const PRODUCTION_ENV = NODE_ENV === 'production';

const SOURCE_MAP = NODE_ENV !== 'production' && SOURCE_MAP_ENV !== 'false';

const DROP_CONSOLE_IN_PROD = true;

const RELOADER_PORTS = {
  BACKGROUND: 9090,
  FOREGROUND: 9091
};

export const ALL_VENDORS = ['chrome', 'brave', 'firefox', 'opera', 'safari'] as const;

export type Vendor = typeof ALL_VENDORS[number];

const MANIFEST_VERSION_BY_VENDORS: Record<Vendor, 2 | 3> = {
  chrome: 3,
  brave: 2,
  firefox: 2,
  opera: 2,
  safari: 2
};

export const getManifestVersion = (vendor: string) => MANIFEST_VERSION_BY_VENDORS[vendor as Vendor] || 2;

const MANIFEST_VERSION = getManifestVersion(TARGET_BROWSER);
const BACKGROUND_IS_WORKER = MANIFEST_VERSION === 3;

export {
  NODE_ENV,
  WEBPACK_MODE,
  DEVELOPMENT_ENV,
  PRODUCTION_ENV,
  TARGET_BROWSER,
  SOURCE_MAP,
  DROP_CONSOLE_IN_PROD,
  MANIFEST_VERSION,
  BACKGROUND_IS_WORKER,
  IMAGE_INLINE_SIZE_LIMIT_ENV,
  RELOADER_PORTS
};
