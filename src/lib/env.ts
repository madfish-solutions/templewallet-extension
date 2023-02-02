export const IS_DEV_ENV = process.env.NODE_ENV === 'development';

const IS_PROD_ENV = process.env.NODE_ENV === 'production';

export const BACKGROUND_IS_WORKER = process.env.BACKGROUND_IS_WORKER === 'true';

const REQUIRED_VARS = [
  'TEMPLE_WALLET_API_URL',
  'TEMPLE_WALLET_METADATA_API_URL',
  'TEMPLE_WALLET_DEXES_API_URL',
  'TEMPLE_WALLET_SEGMENT_WRITE_KEY'
] as const;

const REQUIRED_VARS_PROD = ['TEMPLE_WALLET_EVERSTAKE_API_KEY', 'TEMPLE_WALLET_EVERSTAKE_LINK_ID'] as const;

REQUIRED_VARS.forEach(key => {
  if (!process.env[key]) throw new Error(`process.env.${key} is not present`);
});

if (IS_PROD_ENV)
  REQUIRED_VARS_PROD.forEach(key => {
    if (!process.env[key]) throw new Error(`process.env.${key} is not present`);
  });

type RequiredKey = typeof REQUIRED_VARS[number];
type RequiredProdKey = typeof REQUIRED_VARS_PROD[number];

type EnvVarsType = {
  [key in RequiredProdKey]?: string;
} & {
  [key in RequiredKey]: string;
};

export const EnvVars = process.env as unknown as EnvVarsType;
