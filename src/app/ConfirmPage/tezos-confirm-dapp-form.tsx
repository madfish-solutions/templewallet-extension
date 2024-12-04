import React, { memo, useCallback, useMemo } from 'react';

import ConfirmLedgerOverlay from 'app/atoms/ConfirmLedgerOverlay';
import { ModifyFeeAndLimit } from 'app/templates/ExpensesView/ExpensesView';
import { CustomTezosChainIdContext } from 'lib/analytics';
import { useTempleClient } from 'lib/temple/front/client';
import { StoredAccount, TempleAccountType, TempleTezosDAppPayload } from 'lib/temple/types';
import { useSafeState } from 'lib/ui/hooks';
import { getAccountForTezos, isAccountOfActableType } from 'temple/accounts';
import { useAllAccounts, useTezosChainIdLoadingValue } from 'temple/front';

import { ConfirmDAppForm } from './confirm-dapp-form';
import { TezosPayloadContent } from './payload-content';

interface TezosConfirmDAppFormProps {
  payload: TempleTezosDAppPayload;
  id: string;
}

export const TezosConfirmDAppForm = memo<TezosConfirmDAppFormProps>(({ payload, id }) => {
  const { confirmDAppPermission, confirmDAppOperation, confirmDAppSign } = useTempleClient();

  const allAccountsStored = useAllAccounts();
  const allAccounts = useMemo(
    () => allAccountsStored.filter(acc => isAccountOfActableType(acc) && getAccountForTezos(acc)),
    [allAccountsStored]
  );

  const payloadError = payload!.error;
  const tezosChainId = useTezosChainIdLoadingValue(payload.networkRpc, true)!;

  const network = useMemo(
    () => ({ chainId: tezosChainId, rpcBaseURL: payload.networkRpc }),
    [tezosChainId, payload.networkRpc]
  );

  const revealFee = useMemo(() => {
    if (
      payload.type === 'confirm_operations' &&
      payload.estimates &&
      payload.estimates.length === payload.opParams.length + 1
    ) {
      return payload.estimates[0].suggestedFeeMutez;
    }

    return 0;
  }, [payload]);

  const [modifiedTotalFeeValue, setModifiedTotalFeeValue] = useSafeState(
    (payload.type === 'confirm_operations' &&
      payload.opParams.reduce((sum, op) => sum + (op.fee ? +op.fee : 0), 0) + revealFee) ||
      0
  );
  const [modifiedStorageLimitValue, setModifiedStorageLimitValue] = useSafeState(
    (payload.type === 'confirm_operations' && payload.opParams[0].storageLimit) || 0
  );

  const modifiedStorageLimitDisplayed = useMemo(
    () => payload.type === 'confirm_operations' && payload.opParams.length < 2,
    [payload]
  );

  const modifyFeeAndLimit = useMemo<ModifyFeeAndLimit>(
    () => ({
      totalFee: modifiedTotalFeeValue,
      onTotalFeeChange: v => setModifiedTotalFeeValue(v),
      storageLimit: modifiedStorageLimitDisplayed ? modifiedStorageLimitValue : null,
      onStorageLimitChange: v => setModifiedStorageLimitValue(v)
    }),
    [
      modifiedTotalFeeValue,
      setModifiedTotalFeeValue,
      modifiedStorageLimitValue,
      setModifiedStorageLimitValue,
      modifiedStorageLimitDisplayed
    ]
  );

  const handleConfirm = useCallback(
    async (confimed: boolean, selectedAccount: StoredAccount) => {
      const accountPkh = getAccountForTezos(selectedAccount)!.address;
      switch (payload.type) {
        case 'connect':
          return confirmDAppPermission(id, confimed, accountPkh);

        case 'confirm_operations':
          return confirmDAppOperation(id, confimed, modifiedTotalFeeValue - revealFee, modifiedStorageLimitValue);

        case 'sign':
          return confirmDAppSign(id, confimed);
      }
    },
    [
      payload.type,
      confirmDAppPermission,
      id,
      confirmDAppOperation,
      modifiedTotalFeeValue,
      revealFee,
      modifiedStorageLimitValue,
      confirmDAppSign
    ]
  );

  const renderPayload = useCallback(
    (openAccountsModal: EmptyFn, selectedAccount: StoredAccount, confirming: boolean) => (
      <>
        <TezosPayloadContent
          network={network}
          error={payloadError}
          modifyFeeAndLimit={modifyFeeAndLimit}
          account={selectedAccount}
          payload={payload}
          openAccountsModal={openAccountsModal}
        />

        <ConfirmLedgerOverlay displayed={confirming && selectedAccount.type === TempleAccountType.Ledger} />
      </>
    ),
    [modifyFeeAndLimit, network, payload, payloadError]
  );

  return (
    <CustomTezosChainIdContext.Provider value={tezosChainId}>
      <ConfirmDAppForm accounts={allAccounts} payload={payload} onConfirm={handleConfirm}>
        {renderPayload}
      </ConfirmDAppForm>
    </CustomTezosChainIdContext.Provider>
  );
});
