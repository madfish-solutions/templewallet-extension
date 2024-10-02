import { useDidMount, useDidUpdate, useSafeState, useAbortSignal } from 'lib/ui/hooks';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

type TLoading = 'init' | 'more' | false;

export function useActivitiesLoadingLogic<A>(
  loadActivities: (initial: boolean, signal: AbortSignal) => Promise<void>,
  resetDeps: unknown[],
  onReset?: EmptyFn,
  initialIsLoading = true
) {
  const [isLoading, setIsLoading] = useSafeState<TLoading>(initialIsLoading && 'init');
  const [activities, setActivities] = useSafeState<A[]>([]);
  const [reachedTheEnd, setReachedTheEnd] = useSafeState(false);

  const { abort: abortLoading, abortAndRenewSignal } = useAbortSignal();

  function loadNext() {
    if (isLoading || reachedTheEnd) return;

    loadActivities(false, abortAndRenewSignal());
  }

  useDidMount(() => void loadActivities(true, abortAndRenewSignal()));

  useWillUnmount(abortLoading);

  useDidUpdate(() => {
    setActivities([]);
    setIsLoading('init');
    setReachedTheEnd(false);
    onReset?.();

    loadActivities(true, abortAndRenewSignal());
  }, resetDeps);

  return { activities, isLoading, reachedTheEnd, setActivities, setIsLoading, setReachedTheEnd, loadNext };
}
