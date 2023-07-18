import { useSelector } from '../index';
import type { CollectibleDetails } from './state';

export const useCollectibleDetailsSelector = (slug: string): CollectibleDetails | undefined =>
  useSelector(({ collectibles }) => collectibles.details.data[slug]);

export const useIsAdultCollectibleSelector = (slug: string): boolean | undefined =>
  useSelector(({ collectibles }) => collectibles.details.data[slug]?.isAdultContent);
