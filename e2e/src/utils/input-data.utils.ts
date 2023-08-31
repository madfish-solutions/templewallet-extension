import { envVars } from './env.utils';

export const iComparePrivateKeys = {
  defaultSecondPrivateKey: envVars.DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY,
  importedFirstPrivateKey: envVars.IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY
};

const generateRandomContent = () => {
  const wordsArray = ['apple', 'banana', 'carrot', 'dog', 'elephant', 'fish', 'grape', 'hat', 'ice cream', 'jungle'];
  const randomWord = Math.floor(Math.random() * wordsArray.length);

  return wordsArray[randomWord] + Math.floor(Math.random() * 10000).toString();
};

export const iEnterValues = {
  ...iComparePrivateKeys,
  defaultSeedPhrase: envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE,
  defaultPassword: envVars.DEFAULT_PASSWORD,
  watchOnlyPublicKey: envVars.WATCH_ONLY_PUBLIC_KEY_HASH,
  bakerAddress: '',
  shortRandomContent: generateRandomContent(),
  longRandomContent: 'long random content for test + ' + generateRandomContent(),

  // For adding assets, contacts, etc ...
  contactPublicKey: 'tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL',
  secondContactPublicKey: 'tz1eSbADvrQzhH6vWP6MUy6VoEiGPJJZj696',

  customNetworkRPC: envVars.CUSTOM_NETWORK_RPC_URL,
  customTestName: 'Custom Test Net',

  shitTokenContractAddress: 'KT1Td6a28ydPMXKJS5yS5Usadj4Qx5drsCfY', // 'KLL (Killer) token'
  customTokenSymbol: 'KLL', // 'KLL (Killer) token'
  customTokenName: 'Killer', // 'KLL (Killer) token'

  // For transactions
  amount_0_0001: '0.0001',
  amount_0_005: '0.005',
  amount_0_1: '0.1',
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
