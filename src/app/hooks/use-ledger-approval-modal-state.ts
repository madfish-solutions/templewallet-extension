import { useCallback } from 'react';

import { LedgerOperationState } from 'lib/ui';
import { useSafeState } from 'lib/ui/hooks';

export const useLedgerApprovalModalState = () => {
  const [ledgerApprovalModalState, setLedgerApprovalModalState] = useSafeState(LedgerOperationState.NotStarted);

  const handleLedgerModalClose = useCallback(
    () => setLedgerApprovalModalState(LedgerOperationState.NotStarted),
    [setLedgerApprovalModalState]
  );

  return { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose };
};
