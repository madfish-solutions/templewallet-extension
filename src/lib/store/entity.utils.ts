export interface LoadableEntityState<T> {
  data: T;
  error?: string;
  isLoading: boolean;
}

export const createEntity = <T>(data: T, isLoading = false, error?: string): LoadableEntityState<T> => ({
  data,
  isLoading,
  error
});
