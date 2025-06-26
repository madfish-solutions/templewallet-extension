import { FC, ReactElement } from 'react';

import { useDebounce } from 'use-debounce';

import { useDidUpdate } from 'lib/ui/hooks';

interface Props {
  isSyncing: boolean;
  keepTime?: number;
  children: ReactElement;
}

export const LoaderDebounce: FC<Props> = ({ isSyncing, keepTime = 500, children }) => {
  const [isSyncingDebounced, { flush }] = useDebounce(isSyncing, keepTime);

  useDidUpdate(() => {
    if (isSyncing && !isSyncingDebounced) flush(); // Not keeping `false` debounced
  }, [isSyncing]);

  return isSyncing || isSyncingDebounced ? children : null;
};
