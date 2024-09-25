import { startCase } from 'lodash';

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

export const generateEntityNameFromUrl = (url: string) =>
  startCase(
    new URL(url).hostname
      .split(/[^a-z]/i)
      .filter(Boolean)
      .slice(0, -1)
      .join(' ')
  );
