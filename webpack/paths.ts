import * as fs from 'fs';
import * as path from 'path';

import { TARGET_BROWSER } from './env';

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
const PATH_OUTPUT_BACKGROUND = path.join(PATH_OUTPUT, 'background/');
const PATH_OUTPUT_WASM = path.join(PATH_OUTPUT, 'wasm/');
const PATH_LIBTHEMIS_WASM_FILE = path.join(PATH_NODE_MODULES, 'wasm-themis/src/libthemis.wasm');

const DEST_RELATIVE_PATHS = {
  OUTPUT: DEST_RELATIVE_PATH_OUTPUT,
  OUTPUT_PACKED: DEST_RELATIVE_PATH_OUTPUT_PACKED
};

/** Mapping entries' names to source paths */
const IFRAMES = {
  'persona-ad': path.join(PATH_SOURCE, 'content-scripts/replace-ads/persona-ad.iframe.ts')
};

const PATHS = {
  CWD: PATH_CWD,
  NODE_MODULES: PATH_NODE_MODULES,
  SOURCE: PATH_SOURCE,
  PUBLIC: PATH_PUBLIC,
  DEST: PATH_DEST,
  OUTPUT: PATH_OUTPUT,
  OUTPUT_PACKED: PATH_OUTPUT_PACKED,
  OUTPUT_BACKGROUND: PATH_OUTPUT_BACKGROUND,
  OUTPUT_WASM: PATH_OUTPUT_WASM,
  LIBTHEMIS_WASM_FILE: PATH_LIBTHEMIS_WASM_FILE
};

export { DEST_RELATIVE_PATHS, PATHS, IFRAMES };
