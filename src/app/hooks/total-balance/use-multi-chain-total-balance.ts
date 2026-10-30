import { useTezosUsdToTokenRatesSelector } from 'app/store/currency/selectors';
import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { useEvmUsdToTokenRatesSelector } from 'app/store/evm/tokens-exchange-rates/selectors';
import { useBalancesAtomicRecordSelector } from 'app/store/tezos/balances/selectors';
import { getKeyForBalancesRecord } from 'app/store/tezos/balances/utils';
import { EVM_TOKEN_SLUG, TEZ_TOKEN_SLUG } from 'lib/assets/defaults';
import { useEnabledAccountChainTokenSlugs } from 'lib/assets/hooks';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import { useGetEvmGasOrTokenMetadata, useGetTokenOrGasMetadata } from 'lib/metadata';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useMemoWithCompare } from 'lib/ui/hooks';
import { useEnabledEvmChains, useEnabledTezosChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { useIsMultichainBigBalance } from '../listing-logic/use-is-big-balance';

import { useEthStakingSummand } from './use-eth-staking-summand';
import { useTezosStakingSummand } from './use-tezos-staking-summand';
import { calculateTotalDollarValue, tokenBalanceFromRaw } from './utils';

export const useMultiChainTotalBalance = (
  accountTezAddress: string,
  accountEvmAddress: HexString,
  ignoreSmallBalances = false,
  includeStaking = false
) => {
  const enabledChainSlugs = useEnabledAccountChainTokenSlugs(accountTezAddress, accountEvmAddress);

  const tezBalancesAtomic = useBalancesAtomicRecordSelector();
  const evmBalances = useRawEvmAccountBalancesSelector(accountEvmAddress);
  const getTezMetadata = useGetTokenOrGasMetadata();
  const getEvmMetadata = useGetEvmGasOrTokenMetadata();
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

  const tezStakingSummand = useTezosStakingSummand(accountTezAddress, includeStaking);
  const ethStakingSummand = useEthStakingSummand(accountEvmAddress, includeStaking);

  return calculateTotalDollarValue(
    chainSlugs,
    chainSlug => {
      const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

      if (chainKind === TempleChainKind.Tezos) {
        const rawBalance = tezBalancesAtomic[getKeyForBalancesRecord(accountTezAddress, String(chainId))]?.data[slug];

        return tokenBalanceFromRaw(rawBalance, getTezMetadata(String(chainId), slug));
      }

      const evmChainId = Number(chainId);

      return tokenBalanceFromRaw(evmBalances[evmChainId]?.[slug], getEvmMetadata(evmChainId, slug));
    },
    chainSlug => {
      const [chainKind, chainId, slug] = parseChainAssetSlug(chainSlug);

      return chainKind === TempleChainKind.Tezos
        ? chainId === TEZOS_MAINNET_CHAIN_ID
          ? tezMainnetUsdToTokenRates[slug]
          : undefined
        : evmUsdToTokenRates[Number(chainId)]?.[slug];
    }
  )
    .plus(tezStakingSummand)
    .plus(ethStakingSummand)
    .toString();
};
