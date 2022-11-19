import * as path from 'path';
import { zip } from 'zip-a-folder';

import { PATHS } from './consts';

const fileName = path.basename(PATHS.OUTPUT_PACKED);

console.log(`Will zip as: ${fileName}`);

zip(PATHS.OUTPUT, PATHS.OUTPUT_PACKED);
