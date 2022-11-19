import * as path from 'path';
import { zip } from 'zip-a-folder';

import { TARGET_BROWSER, PATHS } from './consts';

const UNPACKED_PATH = PATHS.OUTPUT;

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

const fileName = `${TARGET_BROWSER}.${PACKED_EXTENSION}`;

const PACKED_PATH = path.join(PATHS.DEST, fileName);

console.log(`Will zip as: ${fileName}`);

zip(UNPACKED_PATH, PACKED_PATH);
