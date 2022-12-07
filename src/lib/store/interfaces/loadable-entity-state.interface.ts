export interface LoadableEntityState<T> {
  data: T;
  error?: string;
  isLoading: boolean;
}
