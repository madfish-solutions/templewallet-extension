import { useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { TEZOS_CHAIN_ASSET_SLUG } from 'lib/apis/wert';
import { isTezosGasBalanceError } from 'lib/temple/error-messages/tezos';
import { TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';

export function useTezosGasOnRamp(chainId: string, sourcePkh: string, error: unknown): void {
  const insufficientTez = isTezosGasBalanceError(error, sourcePkh);
  const promptedSourceRef = useRef<string | null>(null);

  useEffect(() => {
    if (!insufficientTez || chainId !== TEZOS_MAINNET_CHAIN_ID) {
      promptedSourceRef.current = null;
      return;
    }

    if (promptedSourceRef.current === sourcePkh) return;

    promptedSourceRef.current = sourcePkh;
    dispatch(setOnRampAssetAction({ chainAssetSlug: TEZOS_CHAIN_ASSET_SLUG }));
  }, [chainId, insufficientTez, sourcePkh]);
}
