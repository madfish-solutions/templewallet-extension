import { useContext, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { CustomEvmChainIdContext, CustomTezosChainIdContext, useErrorTracking } from 'lib/analytics';

export function useGlobalErrorTracking() {
  const tezChainId = useContext(CustomTezosChainIdContext);
  const evmChainId = useContext(CustomEvmChainIdContext);

  const chainId = useMemo(
    () => tezChainId ?? (isDefined(evmChainId) ? String(evmChainId) : undefined),
    [tezChainId, evmChainId]
  );

  useErrorTracking(chainId);
}
