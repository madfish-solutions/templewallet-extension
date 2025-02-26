import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { OperationConfirmationCardRowVariant } from 'app/templates/operation-confirmation-card';
import { toChainAssetSlug } from 'lib/assets/utils';
import {
  AssetMetadataBase,
  EvmCollectibleMetadata,
  EvmNativeTokenMetadata,
  EvmTokenMetadata,
  TokenMetadata as TezosCollectibleMetadata
} from 'lib/metadata/types';
import { atomsToTokens } from 'lib/temple/helpers';
import { OneOfChains } from 'temple/front';
import { AssetsAmounts } from 'temple/types';

const DEFAULT_UNLIMITED_THRESHOLD = new BigNumber(Infinity);

export function useOperationConfirmationCardRowsPropsPart<
  C extends OneOfChains,
  TM extends EvmTokenMetadata | EvmNativeTokenMetadata | AssetMetadataBase,
  CM extends EvmCollectibleMetadata | TezosCollectibleMetadata
>(
  chain: C,
  assetsAmounts: AssetsAmounts,
  useTokenOrGasMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => TM | undefined,
  useCollectibleMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => CM | undefined,
  useNoCategoryMetadataGetter: (chainId: C['chainId']) => (assetSlug: string) => TM | CM | undefined,
  useGenericAssetsMetadataCheck: (chainSlugsToCheck: string[]) => void,
  unlimitedAtomicAmountThreshold = DEFAULT_UNLIMITED_THRESHOLD
) {
  const getTokenOrGasMetadata = useTokenOrGasMetadataGetter(chain.chainId);
  const getCollectibleMetadata = useCollectibleMetadataGetter(chain.chainId);
  const getNoCategoryMetadata = useNoCategoryMetadataGetter(chain.chainId);

  const chainAssetsSlugs = useMemo(
    () => Object.keys(assetsAmounts).map(slug => toChainAssetSlug(chain.kind, chain.chainId, slug)),
    [assetsAmounts, chain.chainId, chain.kind]
  );
  useGenericAssetsMetadataCheck(chainAssetsSlugs);

  const allAssetsAreCollectibles = useMemo(
    () => Object.entries(assetsAmounts).every(([slug, { isNft }]) => Boolean(getCollectibleMetadata(slug)) || isNft),
    [assetsAmounts, getCollectibleMetadata]
  );

  const castVolume = useCallback(
    (atomicAmount: BigNumber, decimals?: number) =>
      atomicAmount.abs().lt(unlimitedAtomicAmountThreshold)
        ? atomsToTokens(atomicAmount, decimals ?? 0)
        : new BigNumber(atomicAmount.isNegative() ? -Infinity : Infinity),
    [unlimitedAtomicAmountThreshold]
  );

  return useMemo(
    () =>
      Object.entries(assetsAmounts).map(([assetSlug, { atomicAmount, isNft }]) => {
        const tokenOrGasMetadata = getTokenOrGasMetadata(assetSlug);
        const collectibleMetadata = getCollectibleMetadata(assetSlug);
        const noCategoryAssetMetadata = getNoCategoryMetadata(assetSlug);

        if (tokenOrGasMetadata || (noCategoryAssetMetadata && !isNft)) {
          const assetMetadata = (tokenOrGasMetadata ?? noCategoryAssetMetadata)!;

          return {
            volume: castVolume(atomicAmount, assetMetadata.decimals),
            symbol: assetMetadata.symbol ?? assetMetadata.name,
            chain,
            assetSlug,
            variant: OperationConfirmationCardRowVariant.Token
          };
        }

        if (collectibleMetadata || (noCategoryAssetMetadata && isNft)) {
          const assetMetadata = (collectibleMetadata ?? noCategoryAssetMetadata)!;

          return {
            volume: castVolume(atomicAmount, assetMetadata.decimals),
            symbol:
              ('collectibleName' in assetMetadata ? assetMetadata.collectibleName : undefined) ??
              assetMetadata.name ??
              assetMetadata.symbol,
            chain,
            assetSlug,
            variant: allAssetsAreCollectibles
              ? OperationConfirmationCardRowVariant.AllCollectibles
              : OperationConfirmationCardRowVariant.Collectible
          };
        }

        return {
          volume: castVolume(atomicAmount),
          symbol: undefined,
          chain,
          assetSlug,
          variant: allAssetsAreCollectibles
            ? OperationConfirmationCardRowVariant.AllCollectibles
            : isNft
            ? OperationConfirmationCardRowVariant.Collectible
            : OperationConfirmationCardRowVariant.Token
        };
      }),
    [
      allAssetsAreCollectibles,
      assetsAmounts,
      chain,
      castVolume,
      getCollectibleMetadata,
      getTokenOrGasMetadata,
      getNoCategoryMetadata
    ]
  );
}
