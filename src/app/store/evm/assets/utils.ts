import { Draft } from '@reduxjs/toolkit';

import { EvmStoredAssetsRecords } from './state';

export const getChainRecords = (state: Draft<EvmStoredAssetsRecords>, publicKeyHash: HexString, chainId: number) => {
  if (!state[publicKeyHash]) state[publicKeyHash] = {};
  const accountTokens = state[publicKeyHash];

  if (!accountTokens[chainId]) accountTokens[chainId] = {};

  return accountTokens[chainId];
};
