import { createReducer } from '@reduxjs/toolkit';
import { getAddress } from 'viem';

import { NATIVE_TOKEN_INDEX } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { isPositiveCollectibleBalance, isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { proceedLoadedEvmAssetsAction, putNewEvmCollectibleAction, putNewEvmTokenAction } from './actions';
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

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const contractAddress = getAddress(item.contract_address);

      if (item.nft_data) {
        for (const nftItem of item.nft_data) {
          if (!isPositiveCollectibleBalance(nftItem)) continue;

          const slug = toTokenSlug(contractAddress, nftItem.token_id);

          const stored = chainCollectibles[slug];
          if (!stored) chainCollectibles[slug] = { status: 'idle' };
        }

        continue;
      }

      if (i === NATIVE_TOKEN_INDEX || !isPositiveTokenBalance(item)) continue;

      const slug = toTokenSlug(contractAddress);

      const stored = chainTokens[slug];
      if (!stored) chainTokens[slug] = { status: 'idle' };
    }
  });

  builder.addCase(putNewEvmTokenAction, ({ tokens }, { payload }) => {
    const { publicKeyHash, chainId, assetSlug } = payload;

    if (!tokens[publicKeyHash]) tokens[publicKeyHash] = {};
    const accountTokens = tokens[publicKeyHash];

    if (!accountTokens[chainId]) accountTokens[chainId] = {};
    const chainTokens = accountTokens[chainId];

    chainTokens[assetSlug] = { status: 'idle' };
  });

  builder.addCase(putNewEvmCollectibleAction, ({ collectibles }, { payload }) => {
    const { publicKeyHash, chainId, assetSlug } = payload;

    if (!collectibles[publicKeyHash]) collectibles[publicKeyHash] = {};
    const accountCollectibles = collectibles[publicKeyHash];

    if (!accountCollectibles[chainId]) accountCollectibles[chainId] = {};
    const chainCollectibles = accountCollectibles[chainId];

    chainCollectibles[assetSlug] = { status: 'idle' };
  });
});
