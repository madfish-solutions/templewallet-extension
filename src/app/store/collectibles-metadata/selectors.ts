import { useSelector } from '../root-state.selector';

export const useAllCollectiblesMetadataSelector = () =>
  useSelector(({ collectiblesMetadata }) => collectiblesMetadata.records);

export const useCollectibleMetadataSelector = (slug: string) =>
  useSelector(state => state.collectiblesMetadata.records.get(slug));

export const useCollectiblesMetadataLoadingSelector = () =>
  useSelector(({ collectiblesMetadata }) => collectiblesMetadata.isLoading);
