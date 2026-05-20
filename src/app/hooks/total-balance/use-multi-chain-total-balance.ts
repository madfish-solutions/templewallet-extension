import { useMemo } from 'react';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledAccountChainTokenSlugs } from 'lib/assets/hooks';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals, useGetTezosAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useIsMultichainBigBalance } from '../listing-logic/use-is-big-balance';

import { calculateTotalDollarValue } from './utils';

export const useMultiChainTotalBalance = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  ignoreSmallBalances = false
) => {
  const enabledChainSlugs = useEnabledAccountChainTokenSlugs(accountTezAddress, accountEvmAddress);

  const getTezBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(accountTezAddress);
  const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);
  const isBigBalance = useIsMultichainBigBalance(accountTezAddress, accountEvmAddress);

  const tezMainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();

  const enabledTezChains = useEnabledTezosChains();
  const enabledEvmChains = useEnabledEvmChains();

  const chainSlugs = useMemoWithCompare(
    () =>
      enabledTezChains
        .map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG))
        .concat(
          enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
          enabledChainSlugs
        )
        .filter(slug => !ignoreSmallBalances || isBigBalance(slug)),
    [enabledChainSlugs, enabledEvmChains, enabledTezChains, isBigBalance, ignoreSmallBalances]
  );

  return useMemo(
    () =>
      calculateTotalDollarValue(
        chainSlugs,
        chainSlug => {
          const [chainKind, chainId, slug] = fromChainAssetSlug(chainSlug);

          return chainKind === TempleChainKind.Tezos
            ? getTezBalance(chainId as string, slug)
            : getEvmBalance(Number(chainId), slug);
        },
        chainSlug => {
          const [chainKind, chainId, slug] = fromChainAssetSlug(chainSlug);

          return chainKind === TempleChainKind.Tezos
            ? chainId === TEZOS_MAINNET_CHAIN_ID
              ? tezMainnetUsdToTokenRates[slug]
              : undefined
            : evmUsdToTokenRates[Number(chainId)]?.[slug];
        }
      ),
    [chainSlugs, evmUsdToTokenRates, getEvmBalance, getTezBalance, tezMainnetUsdToTokenRates]
  );
};
