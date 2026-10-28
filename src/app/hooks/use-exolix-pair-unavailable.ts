import { useSyncExternalStore } from 'react';

import { getExolixPairUnavailableError, subscribeToExolixPairAvailability } from 'lib/apis/exolix/pair';

export const useExolixPairUnavailable = (pairKey: string): boolean =>
  useSyncExternalStore(subscribeToExolixPairAvailability, () => Boolean(getExolixPairUnavailableError(pairKey)));
