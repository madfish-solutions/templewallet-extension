import { Dispatch, SetStateAction, useEffect, useState } from 'react';

const SECRET_REVEAL_TIME = 20 * 1000;

export const useSecretState = <S = string>(): [S | null, Dispatch<SetStateAction<S | null>>] => {
  const [secretState, setSecretState] = useState<S | null>(null);

  useEffect(() => {
    if (secretState) {
      const timer = setTimeout(() => setSecretState(null), SECRET_REVEAL_TIME);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [secretState, setSecretState]);

  return [secretState, setSecretState];
};
