/*
  There is no WebPack-based solution to zip output of multiple configurations.
*/

import * as path from 'path';
import { zip } from 'zip-a-folder';

import { PATHS } from './paths';

const fileName = path.basename(PATHS.OUTPUT_PACKED);

console.log(`Will zip as: ${fileName}`);

zip(PATHS.OUTPUT, PATHS.OUTPUT_PACKED);
