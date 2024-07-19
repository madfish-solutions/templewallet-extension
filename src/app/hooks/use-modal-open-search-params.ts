import { useCallback, useMemo } from 'react';

import { navigate, useLocation } from 'lib/woozie';

export const useModalOpenSearchParams = (paramName: string) => {
  const { search, pathname } = useLocation();
  const isOpen = useMemo(() => {
    const usp = new URLSearchParams(search);

    return Boolean(usp.get(paramName));
  }, [paramName, search]);
  const setModalState = useCallback(
    (newState: boolean) => {
      const newUsp = new URLSearchParams(search);
      if (newState) {
        newUsp.set(paramName, 'true');
      } else {
        newUsp.delete(paramName);
      }

      navigate({ search: newUsp.toString(), pathname });
    },
    [search, pathname, paramName]
  );
  const openModal = useCallback(() => setModalState(true), [setModalState]);
  const closeModal = useCallback(() => setModalState(false), [setModalState]);

  return { isOpen, openModal, closeModal };
};
