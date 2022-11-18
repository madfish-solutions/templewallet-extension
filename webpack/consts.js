const fs = require('fs');
const path = require('path');

const {
  NODE_ENV = 'development',
  TARGET_BROWSER = 'chrome',
  SOURCE_MAP: SOURCE_MAP_ENV,
  IMAGE_INLINE_SIZE_LIMIT: IMAGE_INLINE_SIZE_LIMIT_ENV = '10000'
} = process.env;

const CWD_PATH = fs.realpathSync(process.cwd());
const NODE_MODULES_PATH = path.join(CWD_PATH, 'node_modules');
const SOURCE_PATH = path.join(CWD_PATH, 'src');
const PUBLIC_PATH = path.join(CWD_PATH, 'public');
const DEST_PATH = path.join(CWD_PATH, 'dist');
const WASM_PATH = path.join(NODE_MODULES_PATH, 'wasm-themis/src/libthemis.wasm');
const OUTPUT_PATH = path.join(DEST_PATH, `${TARGET_BROWSER}_unpacked`);
const SCRIPTS_PATH = path.join(OUTPUT_PATH, 'scripts/');


const dotenvPath = path.resolve(CWD_PATH, '.env');

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
  NODE_ENV, TARGET_BROWSER, SOURCE_MAP_ENV, IMAGE_INLINE_SIZE_LIMIT_ENV,
  CWD_PATH, NODE_MODULES_PATH, SOURCE_PATH, PUBLIC_PATH, DEST_PATH, WASM_PATH, OUTPUT_PATH, SCRIPTS_PATH,
};
