import { useCallback, useEffect, useRef, useState } from 'react';

import { isEqual } from 'lodash';

const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
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
    if (!isEqual(prevSources, sources)) {
      const hasSources = sources.length > 0;
      setIndex(hasSources ? 0 : -1);
      setIsLoading(false);
      setIsStackFailed(!hasSources);
    }
  }, [sources, prevSources]);

  const onSuccess = useCallback(() => {
    setIsLoading(false);
  }, []);

  const onFail = useCallback(() => {
    setIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < sources.length) {
        setIsLoading(true);
        return nextIndex;
      } else {
        setIsLoading(false);
        setIsStackFailed(true);
        return prevIndex;
      }
    });
  }, [sources.length]);

  return {
    src: sources[index],
    isLoading,
    isStackFailed,
    onSuccess,
    onFail
  };
};
