import { LoadableEntityState } from './types';

export const createEntity = <T>(data: T, isLoading = false, error?: string): LoadableEntityState<T> => ({
  data,
  isLoading,
  error
});
