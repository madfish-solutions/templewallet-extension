import { createReducer } from '@reduxjs/toolkit';

import { toTokenSlug } from 'lib/assets';
import { isPositiveCollectibleBalance, isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { proceedLoadedEvmAssetsAction } from './actions';
import { EvmAssetsInitialState, EvmAssetsStateInterface } from './state';

export const evmAssetsReducer = createReducer<EvmAssetsStateInterface>(EvmAssetsInitialState, builder => {
  builder.addCase(proceedLoadedEvmAssetsAction, ({ tokens, collectibles }, { payload }) => {
    const { publicKeyHash, chainId, data } = payload;

    if (!tokens[publicKeyHash]) tokens[publicKeyHash] = {};
    const accountTokens = tokens[publicKeyHash];

    if (!collectibles[publicKeyHash]) collectibles[publicKeyHash] = {};
    const accountCollectibles = collectibles[publicKeyHash];

    if (!accountTokens[chainId]) accountTokens[chainId] = {};
    const chainTokens = accountTokens[chainId];

    if (!accountCollectibles[chainId]) accountCollectibles[chainId] = {};
    const chainCollectibles = accountCollectibles[chainId];

    const items = data.items;

    for (const item of items) {
      if (item.nft_data) {
        for (const nftItem of item.nft_data) {
          if (!isPositiveCollectibleBalance(nftItem)) continue;

          const slug = toTokenSlug(item.contract_address, nftItem.token_id);

          const stored = chainCollectibles[slug];
          if (!stored) chainCollectibles[slug] = { status: 'idle' };
        }

        continue;
      }

      if (items.length > 1 && !isPositiveTokenBalance(item)) continue;

      const slug = toTokenSlug(item.contract_address);

      const stored = chainTokens[slug];
      if (!stored) chainTokens[slug] = { status: 'idle' };
    }
  });
});
