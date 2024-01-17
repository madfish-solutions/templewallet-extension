import { useEffect, useMemo, useRef } from 'react';

export const useScrollIntoView = <E extends Element>(condition = true, options?: ScrollIntoViewOptions) => {
  const elemRef = useRef<E | null>(null);

  useEffect(() => {
    if (condition)
      setTimeout(() => {
        elemRef.current?.scrollIntoView(options ?? { block: 'center', behavior: 'smooth' });
      }, 0);
  }, [condition]);

  return elemRef;
};

export const useScrollIntoViewOnMount = <E extends Element>(condition = true, options?: ScrollIntoViewOptions) => {
  const conditionMemo = useMemo(() => condition, []);

  return useScrollIntoView<E>(conditionMemo, options);
};
