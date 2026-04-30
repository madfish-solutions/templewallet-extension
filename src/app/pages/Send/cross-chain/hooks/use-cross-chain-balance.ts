import { useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { useRawEvmAccountBalancesSelector, useRawEvmAssetBalanceSelector } from 'app/store/evm/balances/selectors';
import { useAllAccountBalancesSelector, useBalanceSelector } from 'app/store/tezos/balances/selectors';
import { CrossChainAsset, getAllowedFromAssets, toCrossChainAssetSlug } from 'lib/cross-chain';
import { atomsToTokens } from 'lib/temple/helpers';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { TempleChainKind } from 'temple/types';

export const useCrossChainFromBalance = (asset: CrossChainAsset): BigNumber => {
  const tezosAddress = useAccountAddressForTezos() ?? '';
  const evmAddress: HexString = useAccountAddressForEvm() ?? '0x';
  const isEvm = asset.chainKind === TempleChainKind.EVM;
  const isTezos = asset.chainKind === TempleChainKind.Tezos;

  const tezosRaw = useBalanceSelector(
    tezosAddress,
    isTezos ? String(asset.chainId ?? '') : '',
    isTezos ? (asset.assetSlug ?? '') : ''
  );

  const evmRaw = useRawEvmAssetBalanceSelector(
    evmAddress,
    isEvm ? Number(asset.chainId ?? 0) : 0,
    isEvm ? (asset.assetSlug ?? '') : ''
  );

  if (isTezos && tezosAddress && tezosRaw) {
    return atomsToTokens(new BigNumber(tezosRaw), asset.decimals);
  }
  if (isEvm && evmAddress && evmRaw) {
    return atomsToTokens(new BigNumber(evmRaw), asset.decimals);
  }
  return ZERO;
};

export const useCrossChainFromBalances = (): Record<string, BigNumber> => {
  const tezosAddress = useAccountAddressForTezos() ?? '';
  const evmAddress: HexString = useAccountAddressForEvm() ?? '0x';

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
