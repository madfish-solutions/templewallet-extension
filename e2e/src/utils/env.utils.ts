import * as dotenv from 'dotenv';

dotenv.config();

export const getEnv = (key: string) => process.env[key] ?? '';

export const envVars = {
  DEFAULT_HD_ACCOUNT_SEED_PHRASE: getEnv('DEFAULT_HD_ACCOUNT_SEED_PHRASE'),
  DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY: getEnv('DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY'),
  DEFAULT_HD_ACCOUNT_FIRST_HASH_SHORT_FORM: getEnv('DEFAULT_HD_ACCOUNT_FIRST_HASH_SHORT_FORM'),
  DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY: getEnv('DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY'),
  DEFAULT_PASSWORD: getEnv('DEFAULT_PASSWORD'),
  IMPORTED_HD_ACCOUNT_SEED_PHRASE: getEnv('IMPORTED_HD_ACCOUNT_SEED_PHRASE'),
  IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY: getEnv('IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY'),
  IMPORTED_HD_ACCOUNT_FIRST_HASH_SHORT_FORM: getEnv('IMPORTED_HD_ACCOUNT_FIRST_HASH_SHORT_FORM'),
  WATCH_ONLY_PUBLIC_KEY_HASH: getEnv('WATCH_ONLY_PUBLIC_KEY_HASH'),
  WATCH_ONLY_PUBLIC_KEY_HASH_SHORT_FORM: getEnv('WATCH_ONLY_PUBLIC_KEY_HASH_SHORT_FORM'),
  CONTACT_ADDRESS_PUBLIC_KEY_HASH: getEnv('CONTACT_ADDRESS_PUBLIC_KEY_HASH'),
  CONTACT_ADDRESS_PUBLIC_KEY_HASH_SHORT_FORM: getEnv('CONTACT_ADDRESS_PUBLIC_KEY_HASH_SHORT_FORM')
};

Object.entries(envVars).forEach(([key, val]) => {
  if (!val) throw new Error(`process.env.${key} not found`);
});
