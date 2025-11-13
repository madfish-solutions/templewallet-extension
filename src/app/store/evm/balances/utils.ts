import { Draft } from '@reduxjs/toolkit';
import { getAddress } from 'viem';

import { BalanceItem } from 'lib/apis/temple/endpoints/evm/api.interfaces';
import { isNativeTokenAddress } from 'lib/apis/temple/endpoints/evm/api.utils';
import { toTokenSlug } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { isPositiveCollectibleBalance, isPositiveTokenBalance } from 'lib/utils/evm.utils';

import { AssetSlugBalanceRecord, EvmBalancesStateInterface } from './state';

export const getTokenSlugBalanceRecords = (
  data: BalanceItem[],
  chainId: number,
  updatedAt: number,
  prevTimestamps: StringRecord<number> = {},
  prevBalances: AssetSlugBalanceRecord = {},
  assetsToPreventBalanceErase: string[] = [],
  allowSkewMs: 4_000
) => {
  const applyBalance = (
    balances: AssetSlugBalanceRecord,
    timestamps: StringRecord<number>,
    tokenSlug: string,
    balance: string
  ) => {
    const prevTimestamp = prevTimestamps[tokenSlug] ?? 0;
    const isPrevFresh = prevTimestamp + allowSkewMs >= updatedAt;

    balances[tokenSlug] = isPrevFresh ? prevBalances[tokenSlug] : balance;
    timestamps[tokenSlug] = Math.max(prevTimestamp, updatedAt);
  };

  return data.reduce<{ balances: AssetSlugBalanceRecord; timestamps: StringRecord<number> }>(
    (acc, currentValue) => {
      const { balances, timestamps } = acc;
      const contractAddress = getAddress(currentValue.contract_address);

      if (currentValue.nft_data) {
        for (const nftItem of currentValue.nft_data) {
          if (!isPositiveCollectibleBalance(nftItem)) continue;

          applyBalance(balances, timestamps, toTokenSlug(contractAddress, nftItem.token_id), nftItem.token_balance);
        }

        return acc;
      }

      if (!isPositiveTokenBalance(currentValue)) return acc;

      if (isNativeTokenAddress(chainId, currentValue.contract_address)) {
        applyBalance(balances, timestamps, EVM_TOKEN_SLUG, currentValue.balance);
      } else {
        applyBalance(balances, timestamps, toTokenSlug(contractAddress), currentValue.balance);
      }

      return acc;
    },
    {
      balances: Object.fromEntries(assetsToPreventBalanceErase.map(tokenSlug => [tokenSlug, prevBalances[tokenSlug]])),
      timestamps: Object.fromEntries(
        assetsToPreventBalanceErase.map(tokenSlug => [tokenSlug, prevTimestamps[tokenSlug]])
      )
    }
  );
};

export const prepareAssigning = (state: Draft<EvmBalancesStateInterface>, account: HexString, chainId?: number) => {
  if (!state.balancesAtomic[account]) state.balancesAtomic[account] = {};
  if (!state.dataTimestamps[account]) state.dataTimestamps[account] = {};

  if (typeof chainId !== 'number') return;

  if (!state.balancesAtomic[account][chainId]) state.balancesAtomic[account][chainId] = {};
  if (!state.dataTimestamps[account][chainId]) state.dataTimestamps[account][chainId] = {};
};
