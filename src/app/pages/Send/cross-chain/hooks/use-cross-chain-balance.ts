import BigNumber from 'bignumber.js';

import { useRawEvmAccountBalancesSelector } from 'app/store/evm/balances/selectors';
import { useAllAccountBalancesSelector } from 'app/store/tezos/balances/selectors';
import { useGetEvmTokenBalanceWithDecimals, useGetTezosAccountTokenOrGasBalanceWithDecimals } from 'lib/balances/hooks';
import { CrossChainAsset, getAllowedFromAssets, toCrossChainAssetSlug } from 'lib/cross-chain';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useCrossChainFromBalance = (asset: CrossChainAsset): BigNumber => {
  const tezosAddress = useAccountAddressForTezos() ?? '';
  const evmAddress = useAccountAddressForEvm() ?? '0x';

  const getTezosBalance = useGetTezosAccountTokenOrGasBalanceWithDecimals(tezosAddress);
  const getEvmBalance = useGetEvmTokenBalanceWithDecimals(evmAddress);

  if (asset.chainId == null || !asset.assetSlug) return ZERO;
  if (asset.chainKind === TempleChainKind.Tezos && tezosAddress) {
    return getTezosBalance(String(asset.chainId), asset.assetSlug) ?? ZERO;
  }
  if (asset.chainKind === TempleChainKind.EVM && evmAddress) {
    return getEvmBalance(Number(asset.chainId), asset.assetSlug) ?? ZERO;
  }
  return ZERO;
};

export const useCrossChainFromBalances = (): Record<string, BigNumber> => {
  const tezosAddress = useAccountAddressForTezos() ?? '';
  const evmAddress = useAccountAddressForEvm() ?? '0x';

  const tezosBalances = useAllAccountBalancesSelector(tezosAddress, TEZOS_MAINNET_CHAIN_ID);
  const evmBalances = useRawEvmAccountBalancesSelector(evmAddress);

  const result: Record<string, BigNumber> = {};
  for (const asset of getAllowedFromAssets()) {
    const slug = toCrossChainAssetSlug(asset);
    if (asset.chainKind === TempleChainKind.Tezos && asset.assetSlug) {
      const raw = tezosBalances[asset.assetSlug];
      result[slug] = raw ? atomsToTokens(new BigNumber(raw), asset.decimals) : ZERO;
    } else if (asset.chainKind === TempleChainKind.EVM && asset.chainId != null && asset.assetSlug) {
      const raw = evmBalances[Number(asset.chainId)]?.[asset.assetSlug];
      result[slug] = raw ? atomsToTokens(new BigNumber(raw), asset.decimals) : ZERO;
    } else {
      result[slug] = ZERO;
    }
  }
  return result;
};
