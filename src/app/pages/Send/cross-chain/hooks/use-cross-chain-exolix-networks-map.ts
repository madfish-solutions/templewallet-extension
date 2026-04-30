import { useCallback, useEffect } from 'react';

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

export const useCrossChainExolixNetworksMap = (): CrossChainNetworksMapResult => {
  const map = useExolixNetworksMapSelector();
  const isLoading = useExolixNetworksMapLoadingSelector();
  const error = useExolixNetworksMapErrorSelector();
  const isReady = Object.keys(map).length > 0;

  useEffect(() => {
    if (!isReady && !isLoading && !error) dispatch(loadExolixNetworksMapActions.submit());
  }, [isReady, isLoading, error]);

  const retry = useCallback(() => dispatch(loadExolixNetworksMapActions.submit()), []);

  return { map, isLoading, isReady, error, retry };
};
