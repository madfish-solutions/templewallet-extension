import { createReducer } from '@reduxjs/toolkit';

import { toTokenSlug } from 'lib/assets';
import { isProperCollectibleContract, isProperCollectibleMetadata } from 'lib/utils/evm.utils';

import { proceedLoadedEvmCollectiblesAction } from './actions';
import { EvmCollectiblesInitialState, EvmCollectiblesStateInterface } from './state';

export const evmCollectiblesReducer = createReducer<EvmCollectiblesStateInterface>(
  EvmCollectiblesInitialState,
  builder => {
    builder.addCase(proceedLoadedEvmCollectiblesAction, ({ record }, { payload }) => {
      const { publicKeyHash, chainId, data } = payload;

      if (!record[publicKeyHash]) record[publicKeyHash] = {};
      const accountAssets = record[publicKeyHash];

      if (!accountAssets[chainId]) accountAssets[chainId] = {};
      const chainAssets = accountAssets[chainId];

      const contracts = data.items;

      for (const contract of contracts) {
        if (!isProperCollectibleContract(contract)) continue;

        const collectibles = contract.nft_data;

        for (const collectible of collectibles) {
          if (!isProperCollectibleMetadata(collectible)) continue;

          const slug = toTokenSlug(contract.contract_address, collectible.token_id);

          const stored = chainAssets[slug];
          if (!stored) chainAssets[slug] = { status: 'idle' };
        }
      }
    });
  }
);
