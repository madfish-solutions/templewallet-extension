import { useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { useAllCollectiblesMetadataSelector } from 'app/store/tezos/collectibles-metadata/selectors';
import { useAllNoCategoryTezosAssetsMetadataSelector } from 'app/store/tezos/no-category-assets-metadata/selectors';
import { useAllTokensMetadataSelector } from 'app/store/tezos/tokens-metadata/selectors';
import {
  ActivityOperKindEnum,
  ActivityOperTransferType,
  EvmActivityAsset,
  EvmOperation,
  TezosOperation
} from 'lib/activity';
import { isTezAsset, TEZ_TOKEN_SLUG } from 'lib/assets';
import { fromAssetSlug, toEvmAssetSlug } from 'lib/assets/utils';
import { AssetMetadataBase, useGetTezosGasMetadata } from 'lib/metadata';
import { equalsIgnoreCase } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

// Changes identity with the metadata, unlike the ref-based getters of `lib/metadata`, a mounted bundle row follows it
export const useGetAssetMetadataForTezosBatch = (chainId: string) => {
  const tokensMetadata = useAllTokensMetadataSelector();
  const collectiblesMetadata = useAllCollectiblesMetadataSelector();
  const noCategoryMetadata = useAllNoCategoryTezosAssetsMetadataSelector();
  const getTezosGasMetadata = useGetTezosGasMetadata();

  return useCallback(
    (assetSlug: string): AssetMetadataBase | undefined =>
      isTezAsset(assetSlug)
        ? getTezosGasMetadata(chainId)
        : (tokensMetadata[assetSlug] ?? collectiblesMetadata.get(assetSlug) ?? noCategoryMetadata[assetSlug]),
    [chainId, tokensMetadata, collectiblesMetadata, noCategoryMetadata, getTezosGasMetadata]
  );
};

interface BundleTransfer {
  slug: string;
  amountSigned: string;
}

const netBySlug = (transfers: BundleTransfer[]) =>
  transfers.reduce(
    (nets, { slug, amountSigned }) => nets.set(slug, (nets.get(slug) ?? ZERO).plus(amountSigned)),
    new Map<string, BigNumber>()
  );

const pickBundleFace = (nets: Map<string, BigNumber>, candidateSlugs: Iterable<string | undefined>) => {
  for (const slug of candidateSlugs) {
    const amount = slug ? nets.get(slug) : undefined;

    if (slug && amount && !amount.isZero()) return { slug, amountSigned: amount.toFixed() };
  }

  return undefined;
};

export const getTezosBundleFace = (
  operations: TezosOperation[],
  preferredSlug: string | undefined,
  hasMetadata: (slug: string) => boolean
) => {
  const nets = netBySlug(
    operations.flatMap(operation =>
      operation.kind === ActivityOperKindEnum.transfer && operation.assetSlug && operation.amountSigned
        ? [{ slug: operation.assetSlug, amountSigned: operation.amountSigned }]
        : []
    )
  );

  return pickBundleFace(nets, [preferredSlug, ...[TEZ_TOKEN_SLUG, ...nets.keys()].filter(slug => hasMetadata(slug))]);
};

export const getEvmBundleFace = (
  operations: EvmOperation[],
  preferredSlug: string | undefined,
  hasDecimals: (slug: string, asset: EvmActivityAsset) => boolean
) => {
  const transfers = operations.flatMap(({ kind, asset }) =>
    kind === ActivityOperKindEnum.transfer && asset?.amountSigned
      ? [{ slug: toEvmAssetSlug(asset.contract, asset.tokenId), asset, amountSigned: asset.amountSigned }]
      : []
  );
  const preferredContract = preferredSlug && fromAssetSlug(preferredSlug)[0];
  const face = pickBundleFace(netBySlug(transfers), [
    transfers.find(({ slug }) => equalsIgnoreCase(slug, preferredSlug))?.slug,
    ...transfers.filter(({ asset }) => equalsIgnoreCase(asset.contract, preferredContract)).map(({ slug }) => slug),
    ...transfers.filter(({ slug, asset }) => asset.nft || hasDecimals(slug, asset)).map(({ slug }) => slug)
  ]);
  const transfer = face && transfers.find(({ slug }) => slug === face.slug);

  return face && transfer ? { ...face, asset: transfer.asset } : undefined;
};

export const getEvmNftUnitsSigned = (operations: EvmOperation[], outgoing: boolean) => {
  const nftTransfers = operations.flatMap(operation => {
    if (operation.kind !== ActivityOperKindEnum.transfer || !operation.asset?.nft) return [];

    const { contract, tokenId, amountSigned } = operation.asset;
    const oneUnitSigned = operation.type === ActivityOperTransferType.sendToAccount ? '-1' : '1';

    return [{ slug: toEvmAssetSlug(contract, tokenId), amountSigned: amountSigned ?? oneUnitSigned }];
  });

  return [...netBySlug(nftTransfers).values()]
    .filter(net => net.isNegative() === outgoing)
    .reduce((sum, net) => sum.plus(net), ZERO)
    .toFixed();
};
