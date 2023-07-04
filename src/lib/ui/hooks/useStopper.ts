import { useMemo, useRef } from 'react';

export function useStopper() {
  const symbolRef = useRef<Symbol | null>(null);

  return useMemo(() => {
    const updateSymbolRef = () => (symbolRef.current = Symbol());

    return {
      stop: () => void updateSymbolRef(),
      stopAndBuildChecker: () => {
        const symb = updateSymbolRef();
        return () => symb !== symbolRef.current;
      }
    };
  }, [symbolRef]);
}
