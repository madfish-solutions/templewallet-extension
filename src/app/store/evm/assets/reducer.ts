import { createReducer } from '@reduxjs/toolkit';
import { getAddress } from 'viem';

import { NATIVE_TOKEN_INDEX } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { isPositiveCollectibleBalance, isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { processLoadedEvmAssetsAction, putNewEvmCollectibleAction, putNewEvmTokenAction } from './actions';
import { EvmAssetsInitialState, EvmAssetsStateInterface } from './state';
import { getChainRecords } from './utils';

export const evmAssetsReducer = createReducer<EvmAssetsStateInterface>(EvmAssetsInitialState, builder => {
  builder.addCase(processLoadedEvmAssetsAction, ({ tokens, collectibles }, { payload }) => {
    const { publicKeyHash, chainId, data } = payload;

    const chainTokens = getChainRecords(tokens, publicKeyHash, chainId);
    const chainCollectibles = getChainRecords(collectibles, publicKeyHash, chainId);

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

    const chainTokens = getChainRecords(tokens, publicKeyHash, chainId);

    chainTokens[assetSlug] = { status: 'enabled' };
  });

  builder.addCase(putNewEvmCollectibleAction, ({ collectibles }, { payload }) => {
    const { publicKeyHash, chainId, assetSlug } = payload;

    const chainCollectibles = getChainRecords(collectibles, publicKeyHash, chainId);

    chainCollectibles[assetSlug] = { status: 'enabled' };
  });
});
