import { useCallback } from 'react';

import BigNumber from 'bignumber.js';

import { ActivityOperKindEnum, EvmActivityAsset, EvmOperation, TezosOperation } from 'lib/activity';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { fromAssetSlug, toEvmAssetSlug } from 'lib/assets/utils';
import { useGetCategorizedAssetMetadata, useGetNoCategoryAssetMetadata } from 'lib/metadata';
import { equalsIgnoreCase } from 'lib/utils';
import { ZERO } from 'lib/utils/numbers';

export const useGetAssetMetadataForTezosBatch = (chainId: string) => {
  const getCategorizedAssetMetadata = useGetCategorizedAssetMetadata(chainId);
  const getNoCategoryAssetMetadata = useGetNoCategoryAssetMetadata();

  return useCallback(
    (assetSlug: string) => getCategorizedAssetMetadata(assetSlug) ?? getNoCategoryAssetMetadata(assetSlug),
    [getNoCategoryAssetMetadata, getCategorizedAssetMetadata]
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

export const getTezosBundleFace = (operations: TezosOperation[], preferredSlug?: string) => {
  const nets = netBySlug(
    operations.flatMap(operation =>
      operation.kind === ActivityOperKindEnum.transfer && operation.assetSlug && operation.amountSigned
        ? [{ slug: operation.assetSlug, amountSigned: operation.amountSigned }]
        : []
    )
  );

  return pickBundleFace(nets, [preferredSlug, TEZ_TOKEN_SLUG, ...nets.keys()]);
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
    ...transfers.filter(({ asset }) => equalsIgnoreCase(asset.contract, preferredContract)).map(({ slug }) => slug),
    ...transfers.filter(({ slug, asset }) => asset.nft || hasDecimals(slug, asset)).map(({ slug }) => slug)
  ]);
  const transfer = face && transfers.find(({ slug }) => slug === face.slug);

  return face && transfer ? { ...face, asset: transfer.asset } : undefined;
};

export const getEvmNftTransfersCount = (operations: EvmOperation[]) =>
  operations.filter(({ kind, asset }) => kind === ActivityOperKindEnum.transfer && asset?.nft).length;
