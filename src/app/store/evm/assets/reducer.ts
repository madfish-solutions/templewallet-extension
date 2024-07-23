import { createReducer } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import { getAddress } from 'viem';

import { isNativeTokenAddress } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { storageConfig } from 'lib/store';
import { isPositiveCollectibleBalance, isPositiveTokenBalance } from 'lib/utils/evm.utils';

import {
  processLoadedEvmAssetsAction,
  putNewEvmCollectibleAction,
  putNewEvmTokenAction,
  setEvmCollectibleStatusAction,
  setEvmTokenStatusAction
} from './actions';
import { EvmAssetsInitialState, EvmAssetsStateInterface } from './state';
import { getChainRecords } from './utils';

const evmAssetsReducer = createReducer<EvmAssetsStateInterface>(EvmAssetsInitialState, builder => {
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

      if (isNativeTokenAddress(chainId, item.contract_address) || !isPositiveTokenBalance(item)) continue;

      const slug = toTokenSlug(contractAddress);

      const stored = chainTokens[slug];
      if (!stored) chainTokens[slug] = { status: 'idle' };
    }
  });

  builder.addCase(setEvmTokenStatusAction, ({ tokens }, { payload }) => {
    const { account, chainId, slug, status } = payload;

    const chainTokens = getChainRecords(tokens, account, chainId);
    const token = chainTokens[slug];

    if (token) token.status = status;
    else chainTokens[slug] = { status };
  });

  builder.addCase(setEvmCollectibleStatusAction, ({ collectibles }, { payload }) => {
    const { account, chainId, slug, status } = payload;

    const chainCollectibles = getChainRecords(collectibles, account, chainId);
    const collectible = chainCollectibles[slug];

    if (collectible) collectible.status = status;
    else chainCollectibles[slug] = { status };
  });

  builder.addCase(putNewEvmTokenAction, ({ tokens }, { payload }) => {
    const { publicKeyHash, chainId, assetSlug } = payload;

    const chainTokens = getChainRecords(tokens, publicKeyHash, chainId);

    chainTokens[assetSlug] = { status: 'enabled', manual: true };
  });

  builder.addCase(putNewEvmCollectibleAction, ({ collectibles }, { payload }) => {
    const { publicKeyHash, chainId, assetSlug } = payload;

    const chainCollectibles = getChainRecords(collectibles, publicKeyHash, chainId);

    chainCollectibles[assetSlug] = { status: 'enabled', manual: true };
  });
});

export const evmAssetsPersistedReducer = persistReducer(
  {
    key: 'root.evmAssets',
    ...storageConfig
  },
  evmAssetsReducer
);
