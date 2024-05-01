import { createReducer } from '@reduxjs/toolkit';

import { toTokenSlug } from 'lib/assets';
import { isProperTokenMetadata } from 'lib/utils/evm.utils';

import { proceedLoadedEvmTokensAction } from './actions';
import { EvmTokensInitialState, EvmTokensStateInterface } from './state';

export const evmTokensReducer = createReducer<EvmTokensStateInterface>(EvmTokensInitialState, builder => {
  builder.addCase(proceedLoadedEvmTokensAction, ({ record }, { payload }) => {
    const { publicKeyHash, chainId, data } = payload;

    if (!record[publicKeyHash]) record[publicKeyHash] = {};
    const accountAssets = record[publicKeyHash];

    if (!accountAssets[chainId]) accountAssets[chainId] = {};
    const chainAssets = accountAssets[chainId];

    const items = data.items;

    for (const item of items) {
      if (!isProperTokenMetadata(item)) continue;

      const slug = toTokenSlug(item.contract_address);

      const stored = chainAssets[slug];
      if (!stored) chainAssets[slug] = { status: 'idle' };
    }
  });
});
