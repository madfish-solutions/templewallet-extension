import { capitalize } from 'lodash';

import { ViemChain } from './types';

export const NUMERIC_CHAIN_ID_REGEX = /^([0-9]+|0x[0-9a-f]+)$/i;

export const makeFormValues = ({ name, rpcUrls, id, nativeCurrency, blockExplorers, testnet }: ViemChain) => ({
  name,
  rpcUrl: rpcUrls.default.http[0],
  chainId: String(id),
  symbol: nativeCurrency.symbol,
  explorerUrl: blockExplorers?.default?.url ?? '',
  isTestnet: testnet === true
});

const getEntityNameTokens = (input: string) => input.split(/[^a-z0-9]/i).filter(Boolean);

export const generateEntityNameFromUrl = (url: string) => {
  const { hostname, pathname } = new URL(url);

  return getEntityNameTokens(hostname).slice(0, -1).concat(getEntityNameTokens(pathname)).map(capitalize).join(' ');
};
