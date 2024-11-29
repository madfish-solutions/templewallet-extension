import React, { Fragment, memo, useCallback, useMemo, useState } from 'react';

import { Alert, FormSubmitButton, FormSecondaryButton } from 'app/atoms';
import ConfirmLedgerOverlay from 'app/atoms/ConfirmLedgerOverlay';
import DAppLogo from 'app/atoms/DAppLogo';
import Name from 'app/atoms/Name';
import SubTitle from 'app/atoms/SubTitle';
import AccountBanner from 'app/templates/AccountBanner';
import ConnectBanner from 'app/templates/ConnectBanner';
import NetworkBanner from 'app/templates/NetworkBanner';
import { CustomEvmChainIdContext } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front/client';
import { TempleAccountType, TempleEvmDAppPayload } from 'lib/temple/types';
import { useSafeState } from 'lib/ui/hooks';
import { delay, isTruthy } from 'lib/utils';
import { getAccountForEvm, isAccountOfActableType } from 'temple/accounts';
import { useAccountForEvm, useAllAccounts, useAllEvmChains } from 'temple/front';

import { EvmPayloadContent } from './payload-content';
import { ConfirmPageSelectors } from './selectors';

interface EvmConfirmDAppFormProps {
  payload: TempleEvmDAppPayload;
  id: string;
}

const CONTAINER_STYLE = {
  width: 380,
  height: 610
};

export const EvmConfirmDAppForm = memo<EvmConfirmDAppFormProps>(({ payload, id }) => {
  const { confirmDAppPermission, confirmDAppSign } = useTempleClient();

  const allAccountsStored = useAllAccounts();
  const allAccounts = useMemo(
    () => allAccountsStored.map(acc => (isAccountOfActableType(acc) ? getAccountForEvm(acc) : null)).filter(isTruthy),
    [allAccountsStored]
  );

  const currentAccountForEvm = useAccountForEvm();

  const [accountPkhToConnect, setAccountPkhToConnect] = useState(
    () => currentAccountForEvm?.address || allAccounts[0]!.address
  );

  const evmChains = useAllEvmChains();
  const payloadError = payload!.error;
  const chainId = Number(payload.chainId);
  const rpcBaseURL = evmChains[chainId].rpcBaseURL;

  const network = useMemo(() => ({ chainId, rpcBaseURL }), [chainId, rpcBaseURL]);

  const connectedAccount = useMemo(() => {
    const address = payload.type === 'connect' ? accountPkhToConnect : payload.sourcePkh;

    return allAccounts.find(acc => acc.address === address);
  }, [allAccounts, payload, accountPkhToConnect]);

  const onConfirm = useCallback(
    async (confimed: boolean) => {
      switch (payload.type) {
        case 'connect':
          return confirmDAppPermission(id, confimed, accountPkhToConnect);

        case 'personal_sign':
        case 'sign_typed':
          return confirmDAppSign(id, confimed);
      }
    },
    [id, payload.type, confirmDAppPermission, confirmDAppSign, accountPkhToConnect]
  );

  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const confirm = useCallback(
    async (confirmed: boolean) => {
      setError(null);
      try {
        await onConfirm(confirmed);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await delay();
        setError(err);
      }
    },
    [onConfirm, setError]
  );

  const handleConfirmClick = useCallback(async () => {
    if (confirming || declining) return;

    setConfirming(true);
    await confirm(true);
    setConfirming(false);
  }, [confirming, declining, setConfirming, confirm]);

  const handleDeclineClick = useCallback(async () => {
    if (confirming || declining) return;

    setDeclining(true);
    await confirm(false);
    setDeclining(false);
  }, [confirming, declining, setDeclining, confirm]);

  const handleErrorAlertClose = useCallback(() => setError(null), [setError]);

  const content = useMemo(() => {
    switch (payload.type) {
      case 'connect':
        return {
          title: t('confirmAction', t('connection').toLowerCase()),
          declineActionTitle: t('cancel'),
          declineActionTestID: ConfirmPageSelectors.ConnectAction_CancelButton,
          confirmActionTitle: error ? t('retry') : t('connect'),
          confirmActionTestID: error
            ? ConfirmPageSelectors.ConnectAction_RetryButton
            : ConfirmPageSelectors.ConnectAction_ConnectButton,
          want: (
            <p className="mb-2 text-sm text-center text-gray-700">
              <T
                id="appWouldLikeToConnectToYourWallet"
                substitutions={[
                  <Fragment key="appName">
                    <span className="font-semibold">{payload.origin}</span>
                    <br />
                  </Fragment>
                ]}
              />
            </p>
          )
        };

      case 'personal_sign':
      case 'sign_typed':
        return {
          title: t('confirmAction', t('signAction').toLowerCase()),
          declineActionTitle: t('reject'),
          declineActionTestID: ConfirmPageSelectors.SignAction_RejectButton,
          confirmActionTitle: t('signAction'),
          confirmActionTestID: ConfirmPageSelectors.SignAction_SignButton,
          want: (
            <div className="mb-2 text-sm text-center text-gray-700 flex flex-col items-center">
              <div className="flex items-center justify-center">
                <DAppLogo icon={payload.appMeta.icon} origin={payload.origin} size={16} className="mr-1 shadow-xs" />
                <Name className="font-semibold" style={{ maxWidth: '10rem' }}>
                  {payload.appMeta.name}
                </Name>
              </div>
              <T
                id="appRequestsToSign"
                substitutions={[
                  <Name className="max-w-full text-xs italic" key="origin">
                    {payload.origin}
                  </Name>
                ]}
              />
            </div>
          )
        };
    }
  }, [payload.type, payload.origin, payload.appMeta.name, payload.appMeta.icon, error]);

  return (
    <CustomEvmChainIdContext.Provider value={chainId}>
      <div className="relative bg-white rounded-md shadow-md overflow-y-auto flex flex-col" style={CONTAINER_STYLE}>
        <div className="flex flex-col items-center px-4 py-2">
          <SubTitle small className={payload.type === 'connect' ? 'mt-4 mb-6' : 'mt-4 mb-2'}>
            {content.title}
          </SubTitle>

          {payload.type === 'connect' && (
            <ConnectBanner type={payload.type} origin={payload.origin} appMeta={payload.appMeta} className="mb-4" />
          )}

          {content.want}

          {payload.type === 'connect' && (
            <p className="mb-4 text-xs font-light text-center text-gray-700">
              <T id="viewAccountAddressWarning" />
            </p>
          )}

          {error ? (
            <Alert
              closable
              onClose={handleErrorAlertClose}
              type="error"
              title="Error"
              description={error?.message ?? t('smthWentWrong')}
              className="my-4"
              autoFocus
            />
          ) : (
            <>
              {payload.type !== 'connect' && connectedAccount && (
                <AccountBanner
                  evmNetwork={network}
                  account={connectedAccount}
                  smallLabelIndent
                  className="w-full mb-4"
                />
              )}

              <NetworkBanner network={network} narrow={payload.type === 'connect'} />

              <EvmPayloadContent
                network={network}
                error={payloadError}
                payload={payload}
                accountPkhToConnect={accountPkhToConnect}
                accounts={allAccounts}
                setAccountPkhToConnect={setAccountPkhToConnect}
              />
            </>
          )}
        </div>

        <div className="flex-1" />

        <div className="sticky bottom-0 w-full bg-white shadow-md flex items-stretch px-4 pt-2 pb-4">
          <div className="w-1/2 pr-2">
            <FormSecondaryButton
              type="button"
              className="w-full"
              loading={declining}
              onClick={handleDeclineClick}
              testID={content.declineActionTestID}
              testIDProperties={{ operationType: payload.type }}
            >
              {content.declineActionTitle}
            </FormSecondaryButton>
          </div>

          <div className="w-1/2 pl-2">
            <FormSubmitButton
              type="button"
              className="justify-center w-full"
              loading={confirming}
              onClick={handleConfirmClick}
              testID={content.confirmActionTestID}
              testIDProperties={{ operationType: payload.type }}
            >
              {content.confirmActionTitle}
            </FormSubmitButton>
          </div>
        </div>

        <ConfirmLedgerOverlay displayed={confirming && connectedAccount?.type === TempleAccountType.Ledger} />
      </div>
    </CustomEvmChainIdContext.Provider>
  );
});
