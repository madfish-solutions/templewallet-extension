import { TokenMetadata } from 'lib/metadata';

import { useSelector } from '../index';

export const useTokenMetadataSelector = (slug: string): TokenMetadata | undefined =>
  useSelector(state => state.tokensMetadata.metadataRecord[slug]);

export const useTokensMetadataSelector = () => useSelector(({ tokensMetadata }) => tokensMetadata.metadataRecord);

export const useTokensMetadataLoadingSelector = () =>
  useSelector(({ tokensMetadata }) => tokensMetadata.metadataLoading);
