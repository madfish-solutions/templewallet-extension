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
  amount_0_0001: '0.0001',
  amount_0_005: '0.005',
  amount_0_03: '0.03',
  amount_1: '1',
  kUSD: 'kUSD',
  uUSD: 'uUSD',
  WTZ: 'WTZ',
  wUSDT: 'wUSDT',
  OBJKTCOM: 'Temple NFT'
};

export type IEnterValuesKey = keyof typeof iEnterValues;

export const iSelectTokenSlugs = {
  kUSD: 'KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV_0',
  uUSD: 'KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW_0',
  WTZ: 'KT1PnUZCp3u2KzWr93pn4DD7HAJnm3rWVrgn_0',
  wUSDT: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_18',
  OBJKTCOM: 'KT1DGbb333QNo3e2cpN3YGL5aRwWzkADcPA3_2' // 'Temple NFT'
};
