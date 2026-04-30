import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useRawEvmAccountBalancesSelector, useRawEvmAssetBalanceSelector } from 'app/store/evm/balances/selectors';
import { useAllAccountBalancesSelector, useBalanceSelector } from 'app/store/tezos/balances/selectors';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { CrossChainAsset, getAllowedFromAssets, toCrossChainAssetSlug } from 'lib/cross-chain';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useCrossChainFromBalance = (asset: CrossChainAsset): BigNumber => {
  const tezosAddress = useAccountAddressForTezos() ?? '';
  const evmAddress = (useAccountAddressForEvm() ?? '0x0000000000000000000000000000000000000000') as HexString;

  const tezosRaw = useBalanceSelector(
    tezosAddress,
    asset.chainKind === TempleChainKind.Tezos ? String(asset.chainId ?? '') : '',
    asset.chainKind === TempleChainKind.Tezos ? asset.assetSlug ?? '' : ''
  );

  const evmRaw = useRawEvmAssetBalanceSelector(
    evmAddress,
    asset.chainKind === TempleChainKind.EVM ? Number(asset.chainId ?? 0) : 0,
    asset.chainKind === TempleChainKind.EVM ? asset.assetSlug ?? '' : ''
  );

  if (asset.chainKind === TempleChainKind.Tezos && tezosRaw) {
    return atomsToTokens(new BigNumber(tezosRaw), asset.decimals);
  }
  if (asset.chainKind === TempleChainKind.EVM && evmRaw) {
    return atomsToTokens(new BigNumber(evmRaw), asset.decimals);
  }
  return ZERO;
};

export const useCrossChainFromBalances = (): Record<string, BigNumber> => {
  const tezosAddress = useAccountAddressForTezos() ?? '';
  const evmAddress = (useAccountAddressForEvm() ?? '0x0000000000000000000000000000000000000000') as HexString;

  const tezosBalances = useAllAccountBalancesSelector(tezosAddress, TEZOS_MAINNET_CHAIN_ID);
  const evmBalances = useRawEvmAccountBalancesSelector(evmAddress);

  return useMemo(() => {
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
  }, [tezosBalances, evmBalances]);
};
