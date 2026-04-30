import { useCallback, useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { loadExolixNetworksMapActions } from 'app/store/crypto-exchange/actions';
import {
  useExolixNetworksMapErrorSelector,
  useExolixNetworksMapLoadingSelector,
  useExolixNetworksMapSelector
} from 'app/store/crypto-exchange/selectors';
import { ExolixNetworksOverride } from 'lib/cross-chain';

interface CrossChainNetworksMapResult {
  map: ExolixNetworksOverride;
  isLoading: boolean;
  isReady: boolean;
  error: string | undefined;
  retry: EmptyFn;
}

const RETRY_BACKOFF_MS = 30_000;

export const useCrossChainExolixNetworksMap = (): CrossChainNetworksMapResult => {
  const map = useExolixNetworksMapSelector();
  const isLoading = useExolixNetworksMapLoadingSelector();
  const error = useExolixNetworksMapErrorSelector();
  const isReady = Object.keys(map).length > 0;
  const lastAttemptedAt = useRef(0);

  useEffect(() => {
    if (isReady || isLoading) return;
    const now = Date.now();
    if (now - lastAttemptedAt.current < RETRY_BACKOFF_MS) return;
    lastAttemptedAt.current = now;
    dispatch(loadExolixNetworksMapActions.submit());
  }, [isReady, isLoading, error]);

  const retry = useCallback(() => {
    lastAttemptedAt.current = Date.now();
    dispatch(loadExolixNetworksMapActions.submit());
  }, []);

  return { map, isLoading, isReady, error, retry };
};
