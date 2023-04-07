import { envVars } from './browser-context.class';

export const testDataForInput = {
  defaultSeedPhrase: envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE,
  defaultSecondPrivateKey: envVars.DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY,
  defaultPassword: envVars.DEFAULT_PASSWORD,
  importedFirstPrivateKey: envVars.IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY,
  watchOnlyPublicKey: envVars.WATCH_ONLY_PUBLIC_KEY_HASH,
  bakerAddress: '',

  // For transactions
  low_amount: '0.0001',
  medium_amount: '0.001',
  high_amount: '1',
  KUSD: 'Kolibri',
  uUSD: 'youves uUSD',
  OBJKTCOM: 'Temple NFT'
};
