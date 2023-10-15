import { useCallback, useState } from 'react';

interface RevealRef {
  value: number;
  index: number;
}

const DEFAULT_VALUE = 0;
const RESET_VALUE = -1;

export const useRevealRef = () => {
  const [revealRef, setRevealRef] = useState<null | RevealRef>();

  const getRevealRef = useCallback(
    (index: number) => {
      if (revealRef === null) return RESET_VALUE;
      if (revealRef === undefined) return DEFAULT_VALUE;
      if (index === revealRef.index) return revealRef.value - 1;
      return revealRef.value;
    },
    [revealRef]
  );

  const onReveal = useCallback(
    (index: number) => {
      if (index === revealRef?.index) return;

      setRevealRef({
        index,
        value: revealRef ? revealRef.value + 1 : DEFAULT_VALUE + 1
      });
    },
    [revealRef]
  );

  const resetRevealRef = useCallback(() => setRevealRef(null), []);

  return { resetRevealRef, getRevealRef, onReveal };
};
