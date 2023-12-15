import { useSelector } from '../root-state.selector';

import type { CollectibleDetails } from './state';

export const useCollectibleDetailsSelector = (slug: string): CollectibleDetails | nullish =>
  useSelector(({ collectibles }) => collectibles.details.data[slug]);

export const useAllCollectiblesDetailsLoadingSelector = () =>
  useSelector(({ collectibles }) => collectibles.details.isLoading);

export const useCollectibleIsAdultSelector = (slug: string): boolean | undefined =>
  useSelector(({ collectibles }) => collectibles.adultFlags[slug]?.val);
