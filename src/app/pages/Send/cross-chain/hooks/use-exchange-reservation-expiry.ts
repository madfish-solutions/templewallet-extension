import { useEffect, useState } from 'react';

import { EXOLIX_DEPOSIT_WINDOW_MS } from 'lib/apis/exolix/utils';

export const useExchangeReservationExpiry = (createdAt: string | undefined) => {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!createdAt) return;
    const expiresAt = new Date(createdAt).getTime() + EXOLIX_DEPOSIT_WINDOW_MS;
    const remaining = Math.max(0, expiresAt - Date.now());
    const id = setTimeout(() => setIsExpired(true), remaining);
    return () => clearTimeout(id);
  }, [createdAt]);

  return isExpired;
};
