export interface LoadableState {
  error?: string;
  isLoading: boolean;
}

export interface LoadableEntityState<T> extends LoadableState {
  data: T;
}

export const createEntity = <T>(data: T, isLoading = false, error?: string): LoadableEntityState<T> => ({
  data,
  isLoading,
  error
});
