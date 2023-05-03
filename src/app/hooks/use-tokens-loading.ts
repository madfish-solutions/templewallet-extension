import { TOKENS_SYNC_INTERVAL } from 'lib/fixed-times';
import { useSyncTokens } from 'lib/temple/front/sync-tokens';
import { useInterval } from 'lib/ui/hooks';

export const useTokensLoading = () => {
  const { syncTokens } = useSyncTokens();

  useInterval(syncTokens, TOKENS_SYNC_INTERVAL, [syncTokens]);
};
