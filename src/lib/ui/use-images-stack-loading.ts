import { useCallback, useRef, useState } from 'react';

import { useDidUpdate } from 'lib/ui/hooks';

// Utility to shallow-compare arrays
const arraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((val, i) => val === b[i]);

/**
 * @arg sources // Memoize
 */
export const useImagesStackLoading = (sources: string[]) => {
  const emptyStack = sources.length < 1;

  const prevSourcesRef = useRef<string[]>([]);

  const [isLoading, setIsLoading] = useState(!emptyStack);
  const [isStackFailed, setIsStackFailed] = useState(emptyStack);

  useDidUpdate(() => {
    const sameSources = arraysEqual(prevSourcesRef.current, sources);

    if (!sameSources) {
      prevSourcesRef.current = sources;

      if (sources.length > 0) {
        setIndex(0);
        setIsLoading(true);
        setIsStackFailed(false);
      } else {
        setIndex(-1);
        setIsLoading(false);
        setIsStackFailed(true);
      }
    }
  }, [sources]);

  const [index, setIndex] = useState(emptyStack ? -1 : 0);

  const src = sources[index] as string | undefined;

  const onSuccess = useCallback(() => void setIsLoading(false), []);

  const onFail = useCallback(() => {
    if (isStackFailed) {
      return;
    }

    if (index + 1 === sources.length) {
      setIndex(-1);
      setIsLoading(false);
      setIsStackFailed(true);

      return;
    }

    setIndex(index + 1);
  }, [isStackFailed, sources.length, index]);

  return {
    src,
    isLoading,
    isStackFailed,
    onSuccess,
    onFail
  };
};
