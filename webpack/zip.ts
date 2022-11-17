import * as fs from 'fs';
import * as path from 'path';
import { zip } from 'zip-a-folder';

const { TARGET_BROWSER = 'chrome' } = process.env;

const CWD_PATH = fs.realpathSync(process.cwd());
const DIST_PATH = path.join(CWD_PATH, 'dist');
const UNPACKED_PATH = path.join(DIST_PATH, `${TARGET_BROWSER}_unpacked`);

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

const PACKED_PATH = path.join(CWD_PATH, `dist/${fileName}`);

console.log('Will zip to:', `dist/${fileName}`);

zip(UNPACKED_PATH, PACKED_PATH);
