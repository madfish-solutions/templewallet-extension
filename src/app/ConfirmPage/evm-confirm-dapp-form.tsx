import React, { memo, useCallback, useMemo } from 'react';

import { CustomEvmChainIdContext } from 'lib/analytics';
import { useTempleClient } from 'lib/temple/front/client';
import { StoredAccount, TempleEvmDAppPayload } from 'lib/temple/types';
import { getAccountForEvm, isAccountOfActableType } from 'temple/accounts';
import { useAllAccounts, useAllEvmChains } from 'temple/front';

import { ConfirmDAppForm } from './confirm-dapp-form';
import { EvmPayloadContent } from './payload-content';

interface EvmConfirmDAppFormProps {
  payload: TempleEvmDAppPayload;
  id: string;
}

export const EvmConfirmDAppForm = memo<EvmConfirmDAppFormProps>(({ payload, id }) => {
  const { confirmDAppPermission, confirmDAppSign } = useTempleClient();

  const allAccountsStored = useAllAccounts();
  const allAccounts = useMemo(
    () => allAccountsStored.filter(acc => isAccountOfActableType(acc) && getAccountForEvm(acc)),
    [allAccountsStored]
  );

  const evmChains = useAllEvmChains();
  const payloadError = payload!.error;
  const chainId = Number(payload.chainId);
  const rpcBaseURL = evmChains[chainId].rpcBaseURL;

  const network = useMemo(() => ({ chainId, rpcBaseURL }), [chainId, rpcBaseURL]);

  const handleConfirm = useCallback(
    async (confimed: boolean, selectedAccount: StoredAccount) => {
      const accountPkh = getAccountForEvm(selectedAccount)!.address;
      switch (payload.type) {
        case 'connect':
          return confirmDAppPermission(id, confimed, accountPkh);

        case 'personal_sign':
        case 'sign_typed':
          return confirmDAppSign(id, confimed);
      }
    },
    [id, payload.type, confirmDAppPermission, confirmDAppSign]
  );

  const renderPayload = useCallback(
    (openAccountsModal: EmptyFn, selectedAccount: StoredAccount) => (
      <EvmPayloadContent
        network={network}
        error={payloadError}
        modifyFeeAndLimit={undefined}
        account={selectedAccount}
        payload={payload}
        openAccountsModal={openAccountsModal}
      />
    ),
    [network, payload, payloadError]
  );

  return (
    <CustomEvmChainIdContext.Provider value={chainId}>
      <ConfirmDAppForm accounts={allAccounts} payload={payload} onConfirm={handleConfirm}>
        {renderPayload}
      </ConfirmDAppForm>
    </CustomEvmChainIdContext.Provider>
  );
});
