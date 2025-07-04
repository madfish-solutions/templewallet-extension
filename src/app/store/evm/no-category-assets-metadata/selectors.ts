import { useSelector } from '../../root-state.selector';

import { NoCategoryAssetMetadata } from './state';

export const useEvmNoCategoryAssetsMetadataRecordSelector = () =>
  useSelector(({ evmNoCategoryAssetMetadata }) => evmNoCategoryAssetMetadata.metadataRecord);

export const useEvmChainNoCategoryAssetsMetadataSelector = (chainId: number) =>
  useSelector(({ evmNoCategoryAssetMetadata }) => evmNoCategoryAssetMetadata.metadataRecord[chainId]);

export const useEvmNoCategoryAssetMetadataSelector = (
  chainId: number,
  tokenSlug: string
): NoCategoryAssetMetadata | undefined =>
  useSelector(({ evmNoCategoryAssetMetadata }) => evmNoCategoryAssetMetadata.metadataRecord[chainId]?.[tokenSlug]);

export const useEvmNoCategoryAssetsMetadataLoadingSelector = () =>
  useSelector(({ evmNoCategoryAssetMetadata }) => evmNoCategoryAssetMetadata.metadataLoading);
