import BigNumber from 'bignumber.js';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import {
  useEvmChainUsdToTokenRatesSelector,
  useEvmUsdToTokenRatesSelector
} from 'app/store/evm/tokens-exchange-rates/selectors';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { parseChainAssetSlug } from 'lib/assets/utils';
import {
  useGetEvmChainTokenBalanceWithDecimals,
  useGetEvmTokenBalanceWithDecimals,
  useGetTezosAccountTokenOrGasBalanceWithDecimals,
  useGetTezosChainAccountTokenOrGasBalanceWithDecimals
} from 'lib/balances/hooks';
import { ZERO } from 'lib/utils/numbers';
import { TempleChainKind } from 'temple/types';

const useGenericIsBigBalance = (
  getBalance: SyncFn<string, BigNumber | undefined>,
  getUsdToTokenRate: SyncFn<string, BigNumber.Value | undefined>
) => {
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  return (chainSlug: string) =>
    testnetModeEnabled || (getBalance(chainSlug) ?? ZERO).times(getUsdToTokenRate(chainSlug) ?? ZERO).gte(1);
};

export const useIsMultichainBigBalance = (accountTezAddress: string, accountEvmAddress: HexString) => {
  const getTezBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(accountTezAddress);
  const mainnetTezUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const getEvmBalance = useGetEvmTokenBalanceWithDecimals(accountEvmAddress);
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();
  const getBalance = (chainSlug: string) => {
    const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

    return chainKind === TempleChainKind.Tezos
      ? getTezBalance(chainId as string, slug)
      : getEvmBalance(chainId as number, slug);
  };
  const getExchangeRate = (chainSlug: string) => {
    const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

    return chainKind === TempleChainKind.Tezos
      ? mainnetTezUsdToTokenRates[slug]
      : evmUsdToTokenRates[chainId as number]?.[slug];
  };

  return useGenericIsBigBalance(getBalance, getExchangeRate);
};

export const useIsEvmBigBalance = (publicKeyHash: HexString) => {
  const getBalanceWithDecimals = useGetEvmTokenBalanceWithDecimals(publicKeyHash);
  const evmUsdToTokenRates = useEvmUsdToTokenRatesSelector();

  const getBalance = (chainSlug: string) => {
    const [, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

    return getBalanceWithDecimals(chainId, slug);
  };
  const getUsdToTokenRate = (chainSlug: string) => {
    const [, chainId, slug] = parseChainAssetSlug(chainSlug, TempleChainKind.EVM);

    return evmUsdToTokenRates[chainId]?.[slug];
  };

  return useGenericIsBigBalance(getBalance, getUsdToTokenRate);
};

export const useIsEvmChainBigBalance = (publicKeyHash: HexString, chainId: number) => {
  const getBalance = useGetEvmChainTokenBalanceWithDecimals(publicKeyHash, chainId);
  const usdToTokenRates = useEvmChainUsdToTokenRatesSelector(chainId);
  const getExchangeRate = (slug: string) => usdToTokenRates[slug];

  return useGenericIsBigBalance(getBalance, getExchangeRate);
};

export const useIsTezosBigBalance = (publicKeyHash: string) => {
  const getBalanceWithDecimals = useGetTezosAccountTokenOrGasBalanceWithDecimals(publicKeyHash);
  const tezosUsdToTokenRates = useTezosUsdToTokenRatesSelector();

  const getBalance = (chainSlug: string) => {
    const [, chainId, assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

    return getBalanceWithDecimals(chainId, assetSlug);
  };
  const getUsdToTokenRate = (chainSlug: string) => {
    const [, , assetSlug] = parseChainAssetSlug(chainSlug, TempleChainKind.Tezos);

    return tezosUsdToTokenRates?.[assetSlug];
  };

  return useGenericIsBigBalance(getBalance, getUsdToTokenRate);
};

export const useIsTezosChainBigBalance = (publicKeyHash: string, chainId: string) => {
  const getBalance = useGetTezosChainAccountTokenOrGasBalanceWithDecimals(publicKeyHash, chainId);
  const mainnetUsdToTokenRates = useTezosUsdToTokenRatesSelector();
  const getUsdToTokenRate = (slug: string) => mainnetUsdToTokenRates[slug];

  return useGenericIsBigBalance(getBalance, getUsdToTokenRate);
};
