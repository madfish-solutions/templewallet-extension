import { DependencyList, useMemo, useRef } from 'react';

import { isEqual } from 'lodash';

const VALUE_UNSET = Symbol();

/** Allows to compare return value of `useMemo` hook with previous result.
 * And then return a new result, only when they fail to compare as equal.
 */
export const useMemoWithCompare = <T>(
  factory: () => T,
  deps: DependencyList,
  comparator: (prev: T, next: T) => boolean = isEqual
) => {
  const valueRef = useRef<T | typeof VALUE_UNSET>(VALUE_UNSET);

  return useMemo<T>(() => {
    const nextVal = factory();

    const prevVal = valueRef.current;

    if (prevVal === VALUE_UNSET) return (valueRef.current = nextVal);

    if (comparator(prevVal, nextVal)) return prevVal;

    return (valueRef.current = nextVal);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
