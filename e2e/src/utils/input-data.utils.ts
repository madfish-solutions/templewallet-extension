import { envVars } from './env.utils';

export const iComparePrivateKeys = {
  defaultSecondPrivateKey: envVars.DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY,
  importedFirstPrivateKey: envVars.IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY
};

export const iEnterValues = {
  ...iComparePrivateKeys,
  defaultSeedPhrase: envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE,
  defaultPassword: envVars.DEFAULT_PASSWORD,
  watchOnlyPublicKey: envVars.WATCH_ONLY_PUBLIC_KEY_HASH,
  bakerAddress: '',

  // For transactions
  low_amount: '0.0001',
  medium_amount: '0.005',
  high_amount: '1',
  kUSD: 'kUSD',
  uUSD: 'uUSD',
  OBJKTCOM: 'Temple NFT'
};

export type IEnterValuesKey = keyof typeof iEnterValues;

export const iSelectTokenSlugs = {
  kUSD: 'KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV_0',
  uUSD: 'KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW_0',
  OBJKTCOM: 'KT1DGbb333QNo3e2cpN3YGL5aRwWzkADcPA3_2' // 'Temple NFT'
};
