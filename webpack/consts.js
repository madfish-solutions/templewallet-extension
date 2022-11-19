const fs = require('fs');
const path = require('path');

const {
  NODE_ENV = 'development',
  TARGET_BROWSER = 'chrome',
  SOURCE_MAP: SOURCE_MAP_ENV,
  IMAGE_INLINE_SIZE_LIMIT: IMAGE_INLINE_SIZE_LIMIT_ENV = '10000'
} = process.env;

const DEVELOPMENT_ENV = NODE_ENV === 'development';

const RELOADER_PORTS = {
  BACKGROUND: 9090,
  FOREGROUND: 9091
};

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
  WASM: PATH_WASM
};

const dotenvPath = path.resolve(PATH_CWD, '.env');

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFiles = [
  `${dotenvPath}.${NODE_ENV}.local`,
  // Don't include `.env.local` for `test` environment
  // since normally you expect tests to produce the same
  // results for everyone
  NODE_ENV !== 'test' && `${dotenvPath}.local`,
  `${dotenvPath}.${NODE_ENV}`,
  dotenvPath
].filter(Boolean);

// Load environment variables from .env* files. Suppress warnings using silent
// if this file is missing. dotenv will never modify any environment variables
// that have already been set.  Variable expansion is supported in .env files.
// https://github.com/motdotla/dotenv
// https://github.com/motdotla/dotenv-expand
dotenvFiles.forEach(dotenvFile => {
  if (fs.existsSync(dotenvFile)) {
    require('dotenv-expand')(
      require('dotenv').config({
        path: dotenvFile
      })
    );
  }
});

module.exports = {
  NODE_ENV,
  DEVELOPMENT_ENV,
  TARGET_BROWSER,
  SOURCE_MAP_ENV,
  IMAGE_INLINE_SIZE_LIMIT_ENV,
  DEST_RELATIVE_PATHS,
  PATHS,
  RELOADER_PORTS
};
