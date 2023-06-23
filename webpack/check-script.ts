/*
  There is no WebPack-based solution to enforce chunks' sizes limit, only 'hint' on it.
  `optimization.splitChunks.{maxSize | enforceSizeThreshold}` aren't doing the job,
  when it comes to JSONs, e.g. `currency-list` package
*/

import * as fg from 'fast-glob';
import * as fs from 'fs';
import * as path from 'path';

import { MAX_JS_CHUNK_SIZE_IN_BYTES } from './env';
import { PATHS } from './paths';

const relPaths = fg.sync('**/*.js', { cwd: PATHS.OUTPUT });

const filesOverLimit = relPaths.filter(relPath => {
  const absPath = path.resolve(PATHS.OUTPUT, relPath);
  const { size } = fs.statSync(absPath);
  return size >= MAX_JS_CHUNK_SIZE_IN_BYTES;
});

for (const relPath of filesOverLimit) {
  console.error('This chunk is too large:', path.resolve(PATHS.OUTPUT, relPath));
}

if (filesOverLimit.length) {
  console.info('Chunk size limit is', MAX_JS_CHUNK_SIZE_IN_BYTES, 'bytes');

  process.exit(1);
}
