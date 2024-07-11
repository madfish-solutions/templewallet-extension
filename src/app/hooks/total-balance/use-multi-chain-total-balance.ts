import { useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledAccountChainTokenSlugs } from 'lib/assets/hooks';
import { fromChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmTokenBalanceWithDecimals, useGetTezosAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { isTruthy } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';
import { useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useMultiChainTotalBalance = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const enabledChainSlugs = useEnabledAccountChainTokenSlugs(accountTezAddress, accountEvmAddress);

  const getTezBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(accountTezAddress);
  const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);

  const tezMainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();

  const enabledTezChains = useEnabledTezosChains();
  const enabledEvmChains = useEnabledEvmChains();

  const chainSlugs = useMemo(
    () => [
      ...enabledTezChains.map(chain => toChainAssetSlug(TempleChainKind.Tezos, chain.chainId, TEZ_TOKEN_SLUG)),
      ...enabledEvmChains.map(chain => toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG)),
      ...enabledChainSlugs
    ],
    [enabledChainSlugs, enabledEvmChains, enabledTezChains]
  );

  return useMemo(() => {
    let dollarValue = ZERO;

    for (const chainSlug of chainSlugs) {
      const [chainKind, chainId, slug] = fromChainAssetSlug(chainSlug);

      const balance =
        (chainKind === TempleChainKind.Tezos
          ? getTezBalance(chainId as string, slug)
          : getEvmBalance(Number(chainId), slug)) ?? ZERO;

      const usdToTokenRate =
        (chainKind === TempleChainKind.Tezos
          ? chainId === TEZOS_MAINNET_CHAIN_ID
            ? tezMainnetUsdToTokenRates[slug]
            : ZERO
          : evmUsdToTokenRates[Number(chainId)]?.[slug]) ?? ZERO;

      const tokenDollarValue = isDefined(balance) && isTruthy(usdToTokenRate) ? balance.times(usdToTokenRate) : ZERO;
      dollarValue = dollarValue.plus(tokenDollarValue);
    }

    return dollarValue.toString();
  }, [chainSlugs, evmUsdToTokenRates, getEvmBalance, getTezBalance, tezMainnetUsdToTokenRates]);
};
