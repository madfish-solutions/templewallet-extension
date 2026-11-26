import { useEffect, useState } from 'react';

import { createSwapPreparation, PrepareFn } from './swap-preparation';

interface SwapPreparationParams<T> {
  draftKey: string | null;
  ready: boolean;
  /** Resolves only with everything the first screen needs, rejects otherwise */
  prepare: PrepareFn<T>;
  isUsable?: (prepared: T) => boolean;
}

export const useSwapPreparation = <T>({ draftKey, ready, prepare, isUsable }: SwapPreparationParams<T>) => {
  const [preparation] = useState(createSwapPreparation<T>);

  useEffect(() => {
    preparation.setPrepare(prepare, isUsable);
  });

  useEffect(() => {
    preparation.setDraftKey(draftKey);
  }, [preparation, draftKey]);

  useEffect(() => {
    preparation.setReady(ready);
  }, [preparation, ready]);

  useEffect(() => () => preparation.dispose(), [preparation]);

  return { takePrepared: preparation.takePrepared };
};
