import { createReducer } from '@reduxjs/toolkit';

import { toTokenSlug } from 'lib/assets';
import { isProperMetadata } from 'lib/utils/evm.utils';

import { proceedLoadedEvmAssetsAction } from './actions';
import { EvmAssetsInitialState, EvmAssetsStateInterface } from './state';

export const evmAssetsReducer = createReducer<EvmAssetsStateInterface>(EvmAssetsInitialState, builder => {
  builder.addCase(proceedLoadedEvmAssetsAction, ({ assets }, { payload }) => {
    const { publicKeyHash, chainId, data } = payload;

    if (!assets[publicKeyHash]) assets[publicKeyHash] = {};
    const accountAssets = assets[publicKeyHash];

    if (!accountAssets[chainId]) accountAssets[chainId] = {};
    const chainAssets = accountAssets[chainId];

    const items = data.items;

    for (const item of items) {
      if (!isProperMetadata(item)) continue;

      const slug = toTokenSlug(item.contract_address);

      const stored = chainAssets[slug];
      if (!stored) chainAssets[slug] = { status: 'idle' };
    }
  });
});
