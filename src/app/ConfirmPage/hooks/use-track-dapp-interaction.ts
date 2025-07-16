import { useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { AnalyticsEventCategory, useAnalytics } from 'lib/analytics';
import { EvmOperationKind, getOperationKind } from 'lib/evm/on-chain/transactions';
import { parseEvmTxRequest } from 'lib/evm/on-chain/utils/parse-evm-tx-request';
import { TempleEvmDAppPayload, TempleTezosDAppPayload } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

const evmOperationTitles: Record<EvmOperationKind, string> = {
  [EvmOperationKind.DeployContract]: 'deployContract',
  [EvmOperationKind.Mint]: 'mint',
  [EvmOperationKind.Send]: 'transaction',
  [EvmOperationKind.Other]: 'transaction',
  [EvmOperationKind.Approval]: 'approval',
  [EvmOperationKind.ApprovalForAll]: 'approval'
};

export const useTrackDappInteraction = (payload: TempleTezosDAppPayload | TempleEvmDAppPayload) => {
  const { trackEvent } = useAnalytics();

  const operationType = useMemo(() => {
    switch (payload.type) {
      case 'connect':
        return 'connect';
      case 'sign_typed':
      case 'personal_sign':
      case 'sign':
        return 'sign';
      case 'add_asset':
        return 'addAsset';
      case 'add_chain':
        return 'addNetwork';
      default:
        return payload.chainType === TempleChainKind.EVM
          ? evmOperationTitles[getOperationKind(parseEvmTxRequest(payload).txSerializable)]
          : 'transaction';
    }
  }, [payload]);

  const trackDappInteraction = useCallback(
    (networkName: string, testnet?: boolean) =>
      trackEvent('Dapp interaction', AnalyticsEventCategory.General, {
        domain: payload.appMeta.name,
        operationType,
        network: networkName,
        ...(isDefined(testnet) && { testnet })
      }),
    [operationType, payload.appMeta.name, trackEvent]
  );

  return { trackDappInteraction };
};
