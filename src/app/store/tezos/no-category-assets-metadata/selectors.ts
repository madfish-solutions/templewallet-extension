import type { TokenMetadata } from 'lib/metadata';

import { useSelector } from '../../root-state.selector';

export const useNoCategoryAssetMetadataSelector = (slug: string): TokenMetadata | undefined =>
  useSelector(({ noCategoryAssetMetadata }) => noCategoryAssetMetadata.metadataRecord[slug]);

export const useAllNoCategoryAssetsMetadataSelector = () =>
  useSelector(({ noCategoryAssetMetadata }) => noCategoryAssetMetadata.metadataRecord);

export const useNoCategoryAssetsMetadataLoadingSelector = () =>
  useSelector(({ noCategoryAssetMetadata }) => noCategoryAssetMetadata.metadataLoading);
