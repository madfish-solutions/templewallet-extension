import { LoadableEntityState } from '../interfaces/loadable-entity-state.interface';

export const createEntity = <T>(data: T, isLoading = false, error?: string): LoadableEntityState<T> => ({
  data,
  isLoading,
  error
});
