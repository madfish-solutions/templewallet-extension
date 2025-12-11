import { useEffect } from 'react';

import { HistoryAction, navigate, useLocation } from 'lib/woozie';

const CONFIRMATION_ID_PARAM = 'id';

export const useSyncConfirmationIdToUrl = (confirmationId: string | null) => {
  const { search, pathname, hash } = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(search);
    const currentId = searchParams.get(CONFIRMATION_ID_PARAM);

    if (confirmationId) {
      const isOnConfirmationUrl = pathname === '/' && currentId === confirmationId && searchParams.size === 1;

      if (!isOnConfirmationUrl) {
        const newSearchParams = new URLSearchParams();
        newSearchParams.set(CONFIRMATION_ID_PARAM, confirmationId);

        navigate({ pathname: '/', hash, search: newSearchParams.toString() }, HistoryAction.Replace);
      }
    } else if (currentId) {
      searchParams.delete(CONFIRMATION_ID_PARAM);
      navigate({ pathname, hash, search: searchParams.toString() }, HistoryAction.Replace);
    }
  }, [confirmationId, hash, pathname, search]);
};
