import type { TokenMetadata } from 'lib/metadata';

import { useSelector } from '../root-state.selector';

export const useTokenMetadataSelector = (slug: string): TokenMetadata | undefined =>
  useSelector(state => state.tokensMetadata.metadataRecord[slug]);

export const useAllTokensMetadataSelector = () => useSelector(({ tokensMetadata }) => tokensMetadata.metadataRecord);

export const useTokensMetadataLoadingSelector = () =>
  useSelector(({ tokensMetadata }) => tokensMetadata.metadataLoading);
