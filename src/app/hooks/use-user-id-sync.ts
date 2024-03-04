import { useEffect } from 'react';

import { useUserIdSelector } from 'app/store/settings/selectors';
import { ANALYTICS_USER_ID_STORAGE_KEY } from 'lib/constants';
import { usePassiveStorage } from 'lib/temple/front/storage';

export const useUserIdSync = () => {
  const [storedUserId, setStoredUserId] = usePassiveStorage<string | null>(ANALYTICS_USER_ID_STORAGE_KEY, null);
  const userId = useUserIdSelector();

  useEffect(() => {
    if (userId !== storedUserId) {
      setStoredUserId(userId);
    }
  }, [setStoredUserId, storedUserId, userId]);
};
