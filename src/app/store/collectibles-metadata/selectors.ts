import { tokenToSlug } from 'lib/assets';
import type { TokenMetadata } from 'lib/metadata';

import { useSelector } from '../root-state.selector';

export const useAllCollectiblesMetadataSelector = () =>
  useSelector(({ collectiblesMetadata }) => collectiblesMetadata.records);

export const useCollectibleMetadataSelector = (slug: string): TokenMetadata | undefined =>
  useSelector(state => state.collectiblesMetadata.records.find(record => tokenToSlug(record) === slug));

export const useCollectiblesMetadataLoadingSelector = () =>
  useSelector(({ collectiblesMetadata }) => collectiblesMetadata.isLoading);
