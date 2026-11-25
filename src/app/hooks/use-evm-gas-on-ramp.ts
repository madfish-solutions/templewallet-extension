import { useEffect, useRef } from 'react';

import { dispatch } from 'app/store';
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { isWertSupportedChainAssetSlug } from 'lib/apis/wert';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug } from 'lib/assets/utils';
import { isEvmGasBalanceError } from 'lib/temple/error-messages';
import { TempleChainKind } from 'temple/types';

export function openEvmGasOnRamp(chainId: number): void {
  const chainAssetSlug = toChainAssetSlug(TempleChainKind.EVM, chainId, EVM_TOKEN_SLUG);

  if (isWertSupportedChainAssetSlug(chainAssetSlug)) {
    dispatch(setOnRampAssetAction({ chainAssetSlug }));
  }
}

export function useEvmGasOnRamp(chainId: number, error: unknown): void {
  const insufficientGasBalance = isEvmGasBalanceError(error);
  const promptedChainRef = useRef<number | null>(null);

  useEffect(() => {
    if (!insufficientGasBalance) {
      promptedChainRef.current = null;
      return;
    }

    if (promptedChainRef.current === chainId) return;

    promptedChainRef.current = chainId;
    openEvmGasOnRamp(chainId);
  }, [chainId, insufficientGasBalance]);
}
