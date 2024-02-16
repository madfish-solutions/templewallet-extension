import { MutableRefObject, useCallback, useEffect, useMemo, useState } from 'react';

export const useElementValue = <T extends Node, U>(
  ref: MutableRefObject<T | null>,
  valueFn: (element: T) => U,
  fallbackValue: U,
  mutationObserverOptions: MutationObserverInit
) => {
  const [value, setValue] = useState(() => (ref.current ? valueFn(ref.current) : fallbackValue));

  const updateValue = useCallback(() => {
    setValue(ref.current ? valueFn(ref.current) : fallbackValue);
  }, [valueFn, fallbackValue, ref]);

  const observer = useMemo(() => new MutationObserver(updateValue), [updateValue]);

  const setObservationIfPossible = useCallback(() => {
    if (ref.current) {
      observer.observe(ref.current, mutationObserverOptions);

      return true;
    }

    return false;
  }, [mutationObserverOptions, observer, ref]);

  useEffect(() => {
    const observationIsSet = setObservationIfPossible();

    if (observationIsSet) {
      updateValue();

      return () => observer.disconnect();
    }

    const setObservationInterval = setInterval(() => {
      if (setObservationIfPossible()) {
        updateValue();
        clearInterval(setObservationInterval);
      }
    }, 50);

    return () => {
      clearInterval(setObservationInterval);
      observer.disconnect();
    };
  }, [observer, setObservationIfPossible, updateValue]);

  return value;
};
