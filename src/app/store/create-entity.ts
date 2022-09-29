import { LoadableEntityState } from './types';

// ts-prune-ignore-next
export const createEntity = <T>(data: T, isLoading = false, error?: string): LoadableEntityState<T> => ({
  data,
  isLoading,
  error
});
