import { OutputCurrencyInterface } from './exolix.interface';

export const EXOLIX_CONTACT_LINK =
  'https://docs.google.com/forms/d/e/1FAIpQLSdec4jK16R8uQ-05MRk7QgNi7y3PE5l7ojI5dvMYlfrX2LKDQ/viewform';

export const EXOLIX_TERMS_LINK = 'https://exolix.com/terms';
export const EXOLIX_PRIVICY_LINK = 'https://exolix.com/privacy';

export const outputTokensList: OutputCurrencyInterface[] = [
  {
    code: 'XTZ',
    name: 'Tezos',
    icon: 'https://exolix.com/icons/coins/XTZ.png',
    network: 'XTZ',
    networkFullName: 'Tezos',
    slug: 'tez'
  },
  {
    code: 'USDT',
    icon: 'https://exolix.com/icons/coins/USDT.png',
    name: 'TetherUS',
    network: 'XTZ',
    networkFullName: 'Tezos Mainnet',
    networkShortName: 'Tezos',
    slug: 'KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o_0'
  }
];
