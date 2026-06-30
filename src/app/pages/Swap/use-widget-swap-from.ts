import { BigNumber } from 'bignumber.js';

import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { useEvmChainUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { TEZ_TOKEN_SLUG, EVM_TOKEN_SLUG } from 'lib/assets';
import { useEnabledEvmChainAccountTokenSlugs, useEnabledTezosChainAccountTokenSlugs } from 'lib/assets/hooks/tokens';
import { toChainAssetSlug } from 'lib/assets/utils';
import {
  useGetEvmChainTokenBalanceWithDecimals,
  useGetTezosChainAccountTokenOrGasBalanceWithDecimals
} from 'lib/balances/hooks';
import { EVM_ZERO_ADDRESS, TEZ_BURN_ADDRESS } from 'lib/constants';
import { ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

const MIN_USD_THRESHOLD = new BigNumber(10);

type RateGetter = (slug: string) => string | number | undefined;

const pickHighestUsdSlug = (
  slugs: string[],
  getBalance: (slug: string) => BigNumber | undefined,
  getRate: RateGetter
): string | null => {
  let bestSlug: string | null = null;
  let bestUsd = MIN_USD_THRESHOLD;
  const seen = new Set<string>();

  for (const slug of slugs) {
    if (seen.has(slug)) continue;
    seen.add(slug);

    const usd = (getBalance(slug) ?? ZERO).multipliedBy(getRate(slug) ?? ZERO);
    if (usd.gt(bestUsd)) {
      bestUsd = usd;
      bestSlug = slug;
    }
  }

  return bestSlug;
};

/**
 * Highest-USD-value token (> $10) the user holds on the resolved chain, as a chain-asset-slug, else null.
 * Computed in the UI because balances and USD rates live only in the redux store (never reachable from the
 * background). Returns null until those stores hydrate, so the caller keeps the gas-token baseline meanwhile.
 */
export const useWidgetSwapFromOverride = (
  enabled: boolean,
  chainKind: string | null | undefined,
  chainId: string | null | undefined
): string | null => {
  const evmAddress = useAccountAddressForEvm();
  const tezAddress = useAccountAddressForTezos();

  const isEvm = enabled && chainKind === TempleChainKind.EVM && Boolean(chainId);
  const isTez = enabled && chainKind === TempleChainKind.Tezos && Boolean(chainId);

  const evmChainId = isEvm ? Number(chainId) : ETHEREUM_MAINNET_CHAIN_ID;
  const evmPkh = (isEvm ? evmAddress : undefined) ?? EVM_ZERO_ADDRESS;
  const getEvmBalance = useGetEvmChainTokenBalanceWithDecimals(evmPkh, evmChainId);
  const evmRates = useEvmChainUsdToTokenRatesSelector(evmChainId);
  const evmSlugs = useEnabledEvmChainAccountTokenSlugs(evmPkh, evmChainId);

  const tezChainId = isTez && chainId ? chainId : TEZOS_MAINNET_CHAIN_ID;
  const tezPkh = (isTez ? tezAddress : undefined) ?? TEZ_BURN_ADDRESS;
  const getTezBalance = useGetTezosChainAccountTokenOrGasBalanceWithDecimals(tezPkh, tezChainId);
  const tezRates = useTezosUsdToTokenRatesSelector();
  const tezSlugs = useEnabledTezosChainAccountTokenSlugs(tezPkh, tezChainId);

  if (isEvm && evmAddress) {
    const best = pickHighestUsdSlug([EVM_TOKEN_SLUG, ...evmSlugs], getEvmBalance, slug => evmRates[slug]);
    return best ? toChainAssetSlug(TempleChainKind.EVM, evmChainId, best) : null;
  }

  if (isTez && tezAddress) {
    const rates = tezChainId === TEZOS_MAINNET_CHAIN_ID ? tezRates : {};
    const best = pickHighestUsdSlug([TEZ_TOKEN_SLUG, ...tezSlugs], getTezBalance, slug => rates[slug]);
    return best ? toChainAssetSlug(TempleChainKind.Tezos, tezChainId, best) : null;
  }

  return null;
};
