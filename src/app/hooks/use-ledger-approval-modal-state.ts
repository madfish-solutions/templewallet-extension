import { useCallback, useEffect } from 'react';

import { LedgerOperationState } from 'lib/ui';
import { useSafeState } from 'lib/ui/hooks';

const errorStates = [
  LedgerOperationState.Canceled,
  LedgerOperationState.AppNotReady,
  LedgerOperationState.UnableToConnect
];

export const useLedgerApprovalModalState = () => {
  const [ledgerApprovalModalState, setLedgerApprovalModalState] = useSafeState(LedgerOperationState.NotStarted);

  const handleLedgerModalClose = useCallback(
    () => setLedgerApprovalModalState(LedgerOperationState.NotStarted),
    [setLedgerApprovalModalState]
  );

  useEffect(() => {
    if (ledgerApprovalModalState !== LedgerOperationState.Success && !errorStates.includes(ledgerApprovalModalState)) {
      return;
    }

    const timeout = setTimeout(() => setLedgerApprovalModalState(LedgerOperationState.NotStarted), 1000);

    return () => clearTimeout(timeout);
  }, [ledgerApprovalModalState, setLedgerApprovalModalState]);

  return { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose };
};
