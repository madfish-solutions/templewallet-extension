import * as fs from 'fs';
import * as path from 'path';

import { getManifestVersion } from './manifest';
import { isTruthy } from './utils';

const {
  NODE_ENV = 'development',
  TARGET_BROWSER = 'chrome',
  SOURCE_MAP: SOURCE_MAP_ENV,
  IMAGE_INLINE_SIZE_LIMIT: IMAGE_INLINE_SIZE_LIMIT_ENV = '10000'
} = process.env as {
  NODE_ENV: 'development' | 'production' | 'test';
  TARGET_BROWSER: string;
  SOURCE_MAP?: 'true' | 'false';
  IMAGE_INLINE_SIZE_LIMIT?: string;
};

const WEBPACK_MODE = NODE_ENV === 'test' ? 'none' : NODE_ENV;

const DEVELOPMENT_ENV = NODE_ENV === 'development';
const PRODUCTION_ENV = NODE_ENV === 'production';

const RELOADER_PORTS = {
  BACKGROUND: 9090,
  FOREGROUND: 9091
};

const MANIFEST_VERSION = getManifestVersion(TARGET_BROWSER);
const BACKGROUND_IS_WORKER = MANIFEST_VERSION === 3;

const PACKED_EXTENSION = (() => {
  switch (TARGET_BROWSER) {
    case 'opera':
      return 'crx';

    case 'firefox':
      return 'xpi';

    default:
      return 'zip';
  }
})();

const DEST_RELATIVE_PATH_OUTPUT = `${TARGET_BROWSER}_unpacked`;
const DEST_RELATIVE_PATH_OUTPUT_PACKED = `${TARGET_BROWSER}.${PACKED_EXTENSION}`;

const PATH_CWD = fs.realpathSync(process.cwd());
const PATH_NODE_MODULES = path.join(PATH_CWD, 'node_modules');
const PATH_SOURCE = path.join(PATH_CWD, 'src');
const PATH_PUBLIC = path.join(PATH_CWD, 'public');
const PATH_DEST = path.join(PATH_CWD, 'dist');
const PATH_OUTPUT = path.join(PATH_DEST, DEST_RELATIVE_PATH_OUTPUT);
const PATH_OUTPUT_PACKED = path.join(PATH_DEST, DEST_RELATIVE_PATH_OUTPUT_PACKED);
const PATH_OUTPUT_SCRIPTS = path.join(PATH_OUTPUT, 'scripts/');
const PATH_OUTPUT_BACKGROUND = path.join(PATH_OUTPUT, 'background/');
const PATH_WASM = path.join(PATH_NODE_MODULES, 'wasm-themis/src/libthemis.wasm');

const DEST_RELATIVE_PATHS = {
  OUTPUT: DEST_RELATIVE_PATH_OUTPUT,
  OUTPUT_PACKED: DEST_RELATIVE_PATH_OUTPUT_PACKED
};

const PATHS = {
  CWD: PATH_CWD,
  NODE_MODULES: PATH_NODE_MODULES,
  SOURCE: PATH_SOURCE,
  PUBLIC: PATH_PUBLIC,
  DEST: PATH_DEST,
  OUTPUT: PATH_OUTPUT,
  OUTPUT_PACKED: PATH_OUTPUT_PACKED,
  OUTPUT_SCRIPTS: PATH_OUTPUT_SCRIPTS,
  OUTPUT_BACKGROUND: PATH_OUTPUT_BACKGROUND,
  WASM: PATH_WASM
};

const dotenvPath = path.resolve(PATH_CWD, '.env');

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${dotenvPath}.${NODE_ENV}.local`,
  /*
    Don't include `.env.local` for `test` environment
    since normally you expect tests to produce the same
    results for everyone
  */
  NODE_ENV !== 'test' && `${dotenvPath}.local`,
  `${dotenvPath}.${NODE_ENV}`,
  dotenvPath
].filter(isTruthy);

/*
  Load environment variables from .env* files. Suppress warnings using silent
  if this file is missing. dotenv will never modify any environment variables
  that have already been set.  Variable expansion is supported in .env files.
  - https://github.com/motdotla/dotenv
  - https://github.com/motdotla/dotenv-expand
*/
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv-expand')(
      require('dotenv').config({
        path: dotenvFile
      })
    );
  }
});

export {
  NODE_ENV,
  WEBPACK_MODE,
  DEVELOPMENT_ENV,
  PRODUCTION_ENV,
  TARGET_BROWSER,
  SOURCE_MAP_ENV,
  MANIFEST_VERSION,
  BACKGROUND_IS_WORKER,
  IMAGE_INLINE_SIZE_LIMIT_ENV,
  DEST_RELATIVE_PATHS,
  PATHS,
  RELOADER_PORTS
};
