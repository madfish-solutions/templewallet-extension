import { useRef } from 'react';

export function useStopper() {
  const symbolRef = useRef<Symbol | null>(null);

  const updateSymbolRef = () => (symbolRef.current = Symbol());

  return {
    stop: () => {
      updateSymbolRef();
    },
    stopAndBuildChecker: () => {
      const symb = updateSymbolRef();
      return () => symb !== symbolRef.current;
    }
  };
}
