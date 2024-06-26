import { useCallback } from 'react';

import { BigNumber } from 'bignumber.js';

import {
  useRawEvmAccountBalancesSelector,
  useRawEvmChainAccountBalancesSelector
} from 'app/store/evm/balances/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useAllAccountBalancesSelector, useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { useTezosUsdToTokenRatesSelector } from 'app/store/tezos/currency/selectors';
import {
  useGetEvmTokenBalanceWithDecimals,
  useGetTezosAccountTokenOrGasBalanceWithDecimals,
  useGetTezosChainAccountTokenOrGasBalanceWithDecimals
} from 'lib/balances/hooks';
import { ZERO } from 'lib/utils/numbers';
import { TempleChainKind } from 'temple/types';

import { getKeyForBalancesRecord } from '../../app/store/tezos/balances/utils';

import { fromChainAssetSlug } from './utils';

export const useAccountTokensSortPredicate = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const getTezBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(accountTezAddress);
  const tezUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();

  return useCallback(
    (aChainAssetSlug: string, bChainAssetSlug: string) => {
      const [aChainKind, aChainId, aSlug] = fromChainAssetSlug(aChainAssetSlug);
      const [bChainKind, bChainId, bSlug] = fromChainAssetSlug(bChainAssetSlug);

      const aBalance =
        (aChainKind === TempleChainKind.Tezos
          ? getTezBalance(aChainId as string, aSlug)
          : getEvmBalance(Number(aChainId), aSlug)) ?? ZERO;

      const bBalance =
        (bChainKind === TempleChainKind.Tezos
          ? getTezBalance(bChainId as string, bSlug)
          : getEvmBalance(Number(bChainId), bSlug)) ?? ZERO;

      const aEquity = aBalance.multipliedBy(
        (aChainKind === TempleChainKind.Tezos
          ? tezUsdToTokenRates[aSlug]
          : evmUsdToTokenRates[Number(aChainId)]?.[aSlug]) ?? ZERO
      );

      const bEquity = bBalance.multipliedBy(
        (bChainKind === TempleChainKind.Tezos
          ? tezUsdToTokenRates[bSlug]
          : evmUsdToTokenRates[Number(bChainId)]?.[bSlug]) ?? ZERO
      );

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [getTezBalance, getEvmBalance, tezUsdToTokenRates, evmUsdToTokenRates]
  );
};

export const useTezosAccountTokensSortPredicate = (publicKeyHash: string) => {
  const getBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useTezosUsdToTokenRatesSelector();

  return useCallback(
    (aChainSlug: string, bChainSlug: string) => {
      const [_, aChainId, aSlug] = fromChainAssetSlug<string>(aChainSlug);
      const [_2, bChainId, bSlug] = fromChainAssetSlug<string>(bChainSlug);

      const aBalance = getBalance(aChainId, aSlug) ?? ZERO;
      const bBalance = getBalance(bChainId, bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [getBalance, usdToTokenRates]
  );
};

export const useTezosChainAccountTokensSortPredicate = (publicKeyHash: string, tezosChainId: string) => {
  const getBalance = useGetTezosChainAccountTokenOrGasBalanceWithDecimals(publicKeyHash, tezosChainId);
  const usdToTokenRates = useTezosUsdToTokenRatesSelector();

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = getBalance(aSlug) ?? ZERO;
      const bBalance = getBalance(bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [getBalance, usdToTokenRates]
  );
};

export const useEvmAccountTokensSortPredicate = (publicKeyHash: HexString) => {
  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();

  return useCallback(
    (aChainAssetSlug: string, bChainAssetSlug: string) => {
      const [_, aChainId, aSlug] = fromChainAssetSlug<number>(aChainAssetSlug);
      const [_2, bChainId, bSlug] = fromChainAssetSlug<number>(bChainAssetSlug);

      const aBalance = getBalance(aChainId, aSlug) ?? ZERO;
      const bBalance = getBalance(bChainId, bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[aChainId]?.[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[bChainId]?.[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [getBalance, usdToTokenRates]
  );
};

export const useEvmChainTokensSortPredicate = (publicKeyHash: HexString, chainId: number) => {
  const getBalance = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const usdToTokenRates = useEvmUsdToTokenRatesSelector();

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = getBalance(chainId, aSlug) ?? ZERO;
      const bBalance = getBalance(chainId, bSlug) ?? ZERO;
      const aEquity = aBalance.multipliedBy(usdToTokenRates[chainId]?.[aSlug] ?? ZERO);
      const bEquity = bBalance.multipliedBy(usdToTokenRates[chainId]?.[bSlug] ?? ZERO);

      if (aEquity.isEqualTo(bEquity)) {
        return bBalance.comparedTo(aBalance);
      }

      return bEquity.comparedTo(aEquity);
    },
    [chainId, getBalance, usdToTokenRates]
  );
};

export const useAccountCollectiblesSortPredicate = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const tezosBalancesRaw = useBalancesAtomicRecordSelector();
  const evmBalancesRecord = useRawEvmAccountBalancesSelector(accountEvmAddress);

  return useCallback(
    (aChainAssetSlug: string, bChainAssetSlug: string) => {
      const [aChainKind, aChainId, aSlug] = fromChainAssetSlug(aChainAssetSlug);
      const [bChainKind, bChainId, bSlug] = fromChainAssetSlug(bChainAssetSlug);

      const aBalance =
        aChainKind === TempleChainKind.Tezos
          ? new BigNumber(
              tezosBalancesRaw[getKeyForBalancesRecord(accountTezAddress, aChainId as string)]?.data[aSlug] ?? ZERO
            )
          : new BigNumber(evmBalancesRecord[aChainId as number]?.[aSlug] ?? ZERO);

      const bBalance =
        bChainKind === TempleChainKind.Tezos
          ? new BigNumber(
              tezosBalancesRaw[getKeyForBalancesRecord(accountTezAddress, bChainId as string)]?.data[bSlug] ?? ZERO
            )
          : new BigNumber(evmBalancesRecord[bChainId as number]?.[bSlug] ?? ZERO);

      return bBalance.comparedTo(aBalance);
    },
    [accountTezAddress, evmBalancesRecord, tezosBalancesRaw]
  );
};

export const useTezosAccountCollectiblesSortPredicate = (account: string) => {
  const balancesRaw = useBalancesAtomicRecordSelector();

  return useCallback(
    (aChainSlug: string, bChainSlug: string) => {
      const [_, aChainId, aSlug] = fromChainAssetSlug<string>(aChainSlug);
      const [_2, bChainId, bSlug] = fromChainAssetSlug<string>(bChainSlug);

      const aBalancesKey = getKeyForBalancesRecord(account, aChainId);
      const bBalancesKey = getKeyForBalancesRecord(account, bChainId);

      const aBalance = new BigNumber(balancesRaw[aBalancesKey]?.data[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRaw[bBalancesKey]?.data[bSlug] ?? ZERO);

      return bBalance.comparedTo(aBalance);
    },
    [account, balancesRaw]
  );
};

export const useTezosChainCollectiblesSortPredicate = (publicKeyHash: string, tezosChainId: string) => {
  const balancesRaw = useAllAccountBalancesSelector(publicKeyHash, tezosChainId);

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = new BigNumber(balancesRaw[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRaw[bSlug] ?? ZERO);

      return bBalance.comparedTo(aBalance);
    },
    [balancesRaw]
  );
};

export const useEvmAccountCollectiblesSortPredicate = (publicKeyHash: HexString) => {
  const balancesRecord = useRawEvmAccountBalancesSelector(publicKeyHash);

  return useCallback(
    (aChainAssetSlug: string, bChainAssetSlug: string) => {
      const [_, aChainId, aSlug] = fromChainAssetSlug<number>(aChainAssetSlug);
      const [_2, bChainId, bSlug] = fromChainAssetSlug<number>(bChainAssetSlug);

      const aBalance = new BigNumber(balancesRecord[aChainId]?.[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRecord[bChainId]?.[bSlug] ?? ZERO);

      return bBalance.comparedTo(aBalance);
    },
    [balancesRecord]
  );
};

export const useEvmChainCollectiblesSortPredicate = (publicKeyHash: HexString, evmChainId: number) => {
  const balancesRaw = useRawEvmChainAccountBalancesSelector(publicKeyHash, evmChainId);

  return useCallback(
    (aSlug: string, bSlug: string) => {
      const aBalance = new BigNumber(balancesRaw[aSlug] ?? ZERO);
      const bBalance = new BigNumber(balancesRaw[bSlug] ?? ZERO);

      return bBalance.comparedTo(aBalance);
    },
    [balancesRaw]
  );
};
