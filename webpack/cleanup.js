const fs = require('fs');
const path = require('path');

const { TARGET_BROWSER, PATHS } = require('./consts');

const DIST_PATH = path.join(PATHS.CWD, 'dist');
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

const PACKED_PATH = path.join(PATHS.CWD, `dist/${fileName}`);

fs.rmSync(UNPACKED_PATH, { recursive: true, force: true });

fs.rmSync(PACKED_PATH, { force: true });
