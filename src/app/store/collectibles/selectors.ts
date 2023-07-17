import { useSelector } from '../index';
import type { CollectibleDetails } from './state';

export const useCollectibleDetailsSelector = (slug: string): CollectibleDetails | undefined =>
  useSelector(({ collectibles }) => collectibles.details.data[slug]);

export const useAllCollectiblesDetailsLoadingSelector = () =>
  useSelector(({ collectibles }) => collectibles.details.isLoading);
