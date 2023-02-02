export const IS_DEV_ENV = process.env.NODE_ENV === 'development';

const IS_PROD_ENV = process.env.NODE_ENV === 'production';

export const BACKGROUND_IS_WORKER = process.env.BACKGROUND_IS_WORKER === 'true';

const RequiredEnvVars = {
  TEMPLE_WALLET_API_URL: process.env.TEMPLE_WALLET_API_URL,
  TEMPLE_WALLET_METADATA_API_URL: process.env.TEMPLE_WALLET_METADATA_API_URL,
  TEMPLE_WALLET_DEXES_API_URL: process.env.TEMPLE_WALLET_DEXES_API_URL,
  TEMPLE_WALLET_SEGMENT_WRITE_KEY: process.env.TEMPLE_WALLET_SEGMENT_WRITE_KEY
} as const;

type RequiredEnvVarName = keyof typeof RequiredEnvVars;

const RequiredProdEnvVars = {
  TEMPLE_WALLET_EXOLIX_API_KEY: process.env.TEMPLE_WALLET_EXOLIX_API_KEY,
  TEMPLE_WALLET_EVERSTAKE_API_KEY: process.env.TEMPLE_WALLET_EVERSTAKE_API_KEY,
  TEMPLE_WALLET_EVERSTAKE_LINK_ID: process.env.TEMPLE_WALLET_EVERSTAKE_LINK_ID,
  TEMPLE_WALLET_UTORG_SID: process.env.TEMPLE_WALLET_UTORG_SID
} as const;

type RequiredProdEnvVarName = keyof typeof RequiredProdEnvVars;

for (const key in RequiredEnvVars) {
  if (!RequiredEnvVars[key as RequiredEnvVarName]) throw new Error(`process.env.${key} is not set`);
}

if (IS_PROD_ENV)
  for (const key in RequiredProdEnvVars) {
    if (!RequiredProdEnvVars[key as RequiredProdEnvVarName]) throw new Error(`process.env.${key} is not set`);
  }

type EnvVarsType = {
  [key in RequiredProdEnvVarName]?: string;
} & {
  [key in RequiredEnvVarName]: string;
};

export const EnvVars = (
  IS_PROD_ENV ? Object.assign({}, RequiredEnvVars, RequiredProdEnvVars) : RequiredEnvVars
) as EnvVarsType;
