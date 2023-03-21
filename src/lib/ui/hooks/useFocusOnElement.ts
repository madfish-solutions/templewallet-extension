import { useEffect, useRef } from 'react';

export function useFocusOnElement<E extends HTMLOrSVGElement>(condition = true) {
  const ref = useRef<E>(null);
  const prevConditionRef = useRef(condition);

  useEffect(() => {
    if (!prevConditionRef.current && condition) {
      ref.current?.focus();
    }
    prevConditionRef.current = condition;
  }, [condition]);

  return ref;
}
