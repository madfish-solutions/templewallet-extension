import { BrowserContext } from '../classes/browser-context.class';

import { envVars } from './env.utils';

export const iComparePrivateKeys = {
  defaultSecondPrivateKey: envVars.DEFAULT_HD_ACCOUNT_SECOND_PRIVATE_KEY,
  importedFirstPrivateKey: envVars.IMPORTED_HD_ACCOUNT_FIRST_PRIVATE_KEY
};

const generateRandomContent = () => {
  const wordsArray = ['apple', 'banana', 'carrot', 'dog', 'elephant', 'fish', 'grape', 'hat', 'cream', 'jungle'];
  const randomWord = Math.floor(Math.random() * wordsArray.length);

  return wordsArray[randomWord] + Math.floor(Math.random() * 10000).toString();
};

const randomSeedWord = () => {
  const wordsArray = ['about', 'document', 'lesson', 'scatter', 'above', 'dog', 'letter', 'abuse', 'science'];
  return wordsArray[Math.floor(Math.random() * wordsArray.length)];
};

export const EMPTY_WORD_FOR_INPUTS = 'EMPTY_WORD';

export const iEnterValues = {
  ...iComparePrivateKeys,
  defaultFirstPrivateKey: envVars.DEFAULT_HD_ACCOUNT_FIRST_PRIVATE_KEY,
  defaultFirstPublicKey: envVars.DEFAULT_HD_ACCOUNT_FIRST_PUBLIC_KEY_HASH,
  defaultPassword: envVars.DEFAULT_PASSWORD,

  watchOnlyPublicKey: envVars.WATCH_ONLY_PUBLIC_KEY_HASH,
  bakerAddress: '',

  // Derivation paths
  basicDerivationPath: `m/44'/1729'/0'/0'`, // first account in HD (main)
  customDerivationPath: `m/44'/1729'/10'/0'`, // eleventh account in HD
  invalidDerivationPath: `m/broken44'/1729'/0'/0'`,
  secondInvalidDerivationPath: `m/44'/17broken29'/0'/0'`,
  thirdInvalidDerivationPath: `m/44'/1729'/0broken'/0'`,
  fourthInvalidDerivationPath: `m/44'/1729'/0'/0broken'`,

  // For testing mnemonic inputs
  defaultSeedPhrase: envVars.DEFAULT_HD_ACCOUNT_SEED_PHRASE,
  importedSeedPhrase: envVars.IMPORTED_HD_ACCOUNT_SEED_PHRASE,
  longSeedPhrase24: envVars.LONG_HD_ACCOUNT_SEED_PHRASE,
  invalidSeedPhrase: 'scissors dolphin light ability voice voice sail cruel labor dry screen feature', // words from BIP39
  invalidRandomSeedPhrase: `${randomSeedWord()} document ${EMPTY_WORD_FOR_INPUTS} ${randomSeedWord()} ${randomSeedWord()} ${randomSeedWord()} dog ${EMPTY_WORD_FOR_INPUTS} ${randomSeedWord()} ${randomSeedWord()} ${EMPTY_WORD_FOR_INPUTS} ${randomSeedWord()}`,
  incorrectSeedPhrase: 'alsla sadh 123213 sadaj asdj sajd jewd wedn wedn wedbn wedhb criwl',

  // For input validation
  shortRandomContent: generateRandomContent(),
  longRandomContent: 'long random content for test + long +' + generateRandomContent(),
  сyrillicContent: 'привіт привіт ',

  // For adding assets, contacts, etc ...
  contactPublicKey: 'tz1aWpVn8k5aZvVaCKPMdcPeX8ccm5662SLL',
  secondContactPublicKey: 'tz1eSbADvrQzhH6vWP6MUy6VoEiGPJJZj696',

  customNetworkRPC: envVars.CUSTOM_NETWORK_RPC_URL,
  secondCustomNetworkRPC: envVars.CUSTOM_NETWORK_SECOND_RPC_URL,
  customTestName: 'Custom Test Net',

  // 'KLL (Killer) token'
  customTokenContractAddress: 'KT1Td6a28ydPMXKJS5yS5Usadj4Qx5drsCfY',
  customTokenSymbol: 'KLL',
  customTokenName: 'Killer',
  customTokenIconURL: 'https://i.imgur.com/2s1WRni.png',

  // For transactions
  amount_0_0001: '0.0001',
  amount_0_005: '0.005',
  amount_0_1: '0.1',
  amount_1: '1',
  kUSD: 'kUSD',
  uUSD: 'uUSD',
  WTZ: 'WTZ',
  wUSDT: 'wUSDT'
};

export type IEnterValuesKey = keyof typeof iEnterValues;

export const iSelectTokenSlugs = {
  kUSD: 'KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV_0',
  uUSD: 'KT1XRPEPXbZK25r3Htzp2o1x7xdMMmfocKNW_0',
  WTZ: 'KT1PnUZCp3u2KzWr93pn4DD7HAJnm3rWVrgn_0',
  wUSDT: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ_18',
  OBJKTCOM: 'KT1DGbb333QNo3e2cpN3YGL5aRwWzkADcPA3_2', // 'Temple NFT',
  TestNFT: 'The perfect NFT!'
};

export const iSelectTokensNames = {
  TestNFT: 'The perfect NFT!',
  SecondTestNFT: 'TEZ'
};

export const clearDataFromCurrentInput = async () => {
  await BrowserContext.page.keyboard.press('End');
  await BrowserContext.page.keyboard.down('Shift');
  await BrowserContext.page.keyboard.press('Home');
  await BrowserContext.page.keyboard.up('Shift');
  await BrowserContext.page.keyboard.press('Backspace');
};
