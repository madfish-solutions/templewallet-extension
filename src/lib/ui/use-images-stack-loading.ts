import { useRef, useState } from 'react';

import { useDidUpdate } from 'lib/ui/hooks';
import { areStringArraysEqual } from 'lib/utils/are-string-arrays-equal';

/**
 * @arg sources // Memoize
 */
export const useImagesStackLoading = (sources: string[]) => {
  const emptyStack = sources.length < 1;

  const prevSourcesRef = useRef<string[]>([]);

  const [index, setIndex] = useState(emptyStack ? -1 : 0);

  const [isLoading, setIsLoading] = useState(!emptyStack);
  const [isStackFailed, setIsStackFailed] = useState(emptyStack);

  useDidUpdate(() => {
    const sameSources = areStringArraysEqual(prevSourcesRef.current, sources);

    if (!sameSources) {
      prevSourcesRef.current = sources;

      if (sources.length > 0) {
        setIndex(0);
        setIsLoading(true);
        setIsStackFailed(false);

        const img = new Image();
        img.src = sources[0];
        if (img.complete) {
          setIsLoading(false);
        }
      } else {
        setIndex(-1);
        setIsLoading(false);
        setIsStackFailed(true);
      }
    }
  }, [sources]);

  const src = sources.at(index);

  const onSuccess = () => void setIsLoading(false);

  const onFail = () => {
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
  };

  return {
    src,
    isLoading,
    isStackFailed,
    onSuccess,
    onFail
  };
};
