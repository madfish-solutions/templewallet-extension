import * as Dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import * as fs from 'fs';
import * as path from 'path';

import { NODE_ENV } from './env';
import { isTruthy } from './utils';

const PATH_CWD = fs.realpathSync(process.cwd());

const dotenvDistPath = path.resolve(PATH_CWD, '.env.dist');
const dotenvDistContent = fs.readFileSync(dotenvDistPath, { encoding: 'utf-8' });

const definedEnvVarsNames = Object.keys(Dotenv.parse(dotenvDistContent));

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
    dotenvExpand(
      Dotenv.config({
        path: dotenvFile
      })
    );
  }
});

for (const name of definedEnvVarsNames) {
  if (!process.env[name]) throw new Error(`process.env.${name} is not set`);
}

export { definedEnvVarsNames };
