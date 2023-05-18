import * as Dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

import { NODE_ENV } from './env';
import { isTruthy } from './utils';

const PATH_CWD = fs.realpathSync(process.cwd());

const readDotEnvFile = (path: string) => {
  if (!fs.existsSync(path)) return null;
  const contentString = fs.readFileSync(path, { encoding: 'utf-8' });
  return Dotenv.parse(contentString);
};

const dotenvDistPath = path.resolve(PATH_CWD, '.env.dist');

const distDotEnvFileData = readDotEnvFile(dotenvDistPath);

const requiredEnvFileVarsNames = Object.keys(distDotEnvFileData!);

const dotenvPath = path.resolve(PATH_CWD, '.env');

// https://github.com/bkeepers/dotenv#what-other-env-files-can-i-use
const dotenvFilesPaths = [
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

const envFilesData: Record<string, string> = dotenvFilesPaths.reduce(
  (data, path) => ({ ...data, ...readDotEnvFile(path) }),
  {}
);

for (const name of requiredEnvFileVarsNames) {
  if (!envFilesData[name]) throw new Error(`[.env] Required \`${name}\` value is not set in .env files`);
}

export { envFilesData };
