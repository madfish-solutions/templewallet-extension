import { useCallback, useEffect, useRef, useState } from 'react';

const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

const arraysEqual = (a?: string[], b?: string[]) => {
  if (!a || !b) return false;
  return a.length === b.length && a.every((val, i) => val === b[i]);
};

/**
 * @arg sources // Memoize
 */
export const useImagesStackLoading = (sources: string[]) => {
  const [index, setIndex] = useState(() => (sources.length > 0 ? 0 : -1));
  const [isLoading, setIsLoading] = useState(() => sources.length > 0);
  const [isStackFailed, setIsStackFailed] = useState(() => sources.length === 0);

  const prevSources = usePrevious(sources);

  useEffect(() => {
    if (!arraysEqual(prevSources, sources)) {
      const hasSources = sources.length > 0;
      setIndex(hasSources ? 0 : -1);
      setIsLoading(hasSources);
      setIsStackFailed(!hasSources);
    }
  }, [sources, prevSources]);

  const onSuccess = useCallback(() => {
    setIsLoading(false);
  }, []);

  const onFail = useCallback(() => {
    const nextIndex = index + 1;
    if (nextIndex < sources.length) {
      setIndex(nextIndex);
      setIsLoading(true);
    } else {
      setIsLoading(false);
      setIsStackFailed(true);
    }
  }, [index, sources.length]);

  return {
    src: sources[index],
    isLoading,
    isStackFailed,
    onSuccess,
    onFail
  };
};
