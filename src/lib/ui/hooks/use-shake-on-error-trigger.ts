import { useEffect, useRef, useState } from 'react';

export const useShakeOnErrorTrigger = (submitCount: number, error: unknown) => {
  const [trigger, setTrigger] = useState(false);

  const prevSubmitCountRef = useRef(submitCount);
  useEffect(() => {
    if (submitCount > prevSubmitCountRef.current && error) {
      setTrigger(true);
      setTimeout(() => setTrigger(false), 250);
    }
    prevSubmitCountRef.current = submitCount;
  }, [error, submitCount]);

  return trigger;
};
