import { DependencyList } from 'react';

import { useDidMount, useDidUpdate, useSafeState, useAbortSignal } from 'lib/ui/hooks';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

export const RETRY_AFTER_ERROR_TIMEOUT = 5_000;

interface LoadingControlCallbacks<A> {
  setIsLoading: SyncFn<boolean>;
  setActivities: SyncFn<A[]>;
  setReachedTheEnd: SyncFn<boolean>;
  setError: SyncFn<unknown>;
}

export function useActivitiesLoadingLogic<A>(
  loadActivities: (
    callbacks: LoadingControlCallbacks<A>,
    activities: A[],
    initial: boolean,
    signal: AbortSignal
  ) => Promise<void>,
  resetDeps: DependencyList,
  onReset?: EmptyFn,
  initialIsLoading = true
) {
  const [isLoading, setIsLoading] = useSafeState(initialIsLoading);
  const [activities, setActivities] = useSafeState<A[]>([]);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);
  const [error, setError] = useSafeState<unknown>(null);

  const { abort: abortLoading, abortAndRenewSignal } = useAbortSignal();

  const callbacks = { setIsLoading, setActivities, setReachedTheEnd, setError };

  const loadNext = () => {
    if (isLoading || reachedTheEnd || error) return;

    loadActivities(callbacks, activities, false, abortAndRenewSignal());
  };

  useDidMount(() => void loadActivities(callbacks, activities, true, abortAndRenewSignal()));

  useWillUnmount(abortLoading);

  useDidUpdate(() => {
    setActivities([]);
    setIsLoading(true);
    setReachedTheEnd(false);
    setError(null);
    onReset?.();

    loadActivities(callbacks, activities, true, abortAndRenewSignal());
  }, resetDeps);

  return {
    activities,
    isLoading,
    reachedTheEnd,
    error,
    loadNext
  };
}
