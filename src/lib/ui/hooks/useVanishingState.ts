import { Dispatch, SetStateAction, useEffect, useState } from 'react';

export const useVanishingState = <S = string>(timeout = 20_000): [S | null, Dispatch<SetStateAction<S | null>>] => {
  const [state, setState] = useState<S | null>(null);

  useEffect(() => {
    if (state) {
      const timer = setTimeout(() => setState(null), timeout);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [state, setState]);

  return [state, setState];
};
