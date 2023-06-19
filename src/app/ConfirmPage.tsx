import React, { FC, Fragment, memo, Suspense, useCallback, useMemo, useState } from 'react';

import { Alert, FormSubmitButton, FormSecondaryButton } from 'app/atoms';
import AccountTypeBadge from 'app/atoms/AccountTypeBadge';
import ConfirmLedgerOverlay from 'app/atoms/ConfirmLedgerOverlay';
import HashShortView from 'app/atoms/HashShortView';
import Identicon from 'app/atoms/Identicon';
import Money from 'app/atoms/Money';
import Name from 'app/atoms/Name';
import Spinner from 'app/atoms/Spinner/Spinner';
import SubTitle from 'app/atoms/SubTitle';
import ErrorBoundary from 'app/ErrorBoundary';
import ContentContainer from 'app/layouts/ContentContainer';
import Unlock from 'app/pages/Unlock/Unlock';
import AccountBanner from 'app/templates/AccountBanner';
import Balance from 'app/templates/Balance';
import ConnectBanner from 'app/templates/ConnectBanner';
import CustomSelect, { OptionRenderProps } from 'app/templates/CustomSelect';
import DAppLogo from 'app/templates/DAppLogo';
import { ModifyFeeAndLimit } from 'app/templates/ExpensesView/ExpensesView';
import NetworkBanner from 'app/templates/NetworkBanner';
import OperationView from 'app/templates/OperationView';
import { CustomRpcContext } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { useTempleClient, useAccount, useRelevantAccounts, useCustomChainId, useGasToken } from 'lib/temple/front';
import { TempleAccountType, TempleDAppPayload, TempleAccount, TempleChainId } from 'lib/temple/types';
import { useSafeState } from 'lib/ui/hooks';
import { useLocation } from 'lib/woozie';

import { ConfirmPageSelectors } from './ConfirmPage.selectors';

const ConfirmPage: FC = () => {
  const { ready } = useTempleClient();

  if (ready)
    return (
      <ContentContainer padding={false} className="min-h-screen flex flex-col items-center justify-center">
        <ErrorBoundary whileMessage={t('fetchingConfirmationDetails')}>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-screen">
                <div>
                  <Spinner theme="primary" className="w-20" />
                </div>
              </div>
            }
          >
            <ConfirmDAppForm />
          </Suspense>
        </ErrorBoundary>
      </ContentContainer>
    );

  return <Unlock canImportNew={false} />;
};

interface PayloadContentProps {
  accountPkhToConnect: string;
  setAccountPkhToConnect: (item: string) => void;
  payload: TempleDAppPayload;
  error?: any;
  modifyFeeAndLimit: ModifyFeeAndLimit;
}

const PayloadContent: React.FC<PayloadContentProps> = ({
  accountPkhToConnect,
  setAccountPkhToConnect,
  payload,
  error,
  modifyFeeAndLimit
}) => {
  const allAccounts = useRelevantAccounts(false);
  const AccountOptionContent = useMemo(() => AccountOptionContentHOC(payload.networkRpc), [payload.networkRpc]);
  const chainId = useCustomChainId(payload.networkRpc, true)!;
  const mainnet = chainId === TempleChainId.Mainnet;

  return payload.type === 'connect' ? (
    <div className="w-full flex flex-col">
      <h2 className="mb-2 leading-tight flex flex-col">
        <span className="text-base font-semibold text-gray-700">
          <T id="account" />
        </span>

        <span className="mt-px text-xs font-light text-gray-600 max-w-9/10">
          <T id="toBeConnectedWithDApp" />
        </span>
      </h2>

      <CustomSelect<TempleAccount, string>
        activeItemId={accountPkhToConnect}
        getItemId={getPkh}
        items={allAccounts}
        maxHeight="8rem"
        onSelect={setAccountPkhToConnect}
        OptionIcon={AccountIcon}
        OptionContent={AccountOptionContent}
        autoFocus
      />
    </div>
  ) : (
    <OperationView
      payload={payload}
      error={error}
      networkRpc={payload.networkRpc}
      mainnet={mainnet}
      modifyFeeAndLimit={modifyFeeAndLimit}
    />
  );
};

export default ConfirmPage;

const getPkh = (account: TempleAccount) => account.publicKeyHash;

const ConfirmDAppForm: FC = () => {
  const { getDAppPayload, confirmDAppPermission, confirmDAppOperation, confirmDAppSign } = useTempleClient();
  const allAccounts = useRelevantAccounts(false);
  const account = useAccount();

  const [accountPkhToConnect, setAccountPkhToConnect] = useState(account.publicKeyHash);

  const loc = useLocation();
  const id = useMemo(() => {
    const usp = new URLSearchParams(loc.search);
    const pageId = usp.get('id');
    if (!pageId) {
      throw new Error(t('notIdentified'));
    }
    return pageId;
  }, [loc.search]);

  const { data } = useRetryableSWR<TempleDAppPayload>([id], getDAppPayload, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });
  const payload = data!;
  const payloadError = data!.error;

  const connectedAccount = useMemo(
    () =>
      allAccounts.find(a => a.publicKeyHash === (payload.type === 'connect' ? accountPkhToConnect : payload.sourcePkh)),
    [payload, allAccounts, accountPkhToConnect]
  );

  const onConfirm = useCallback(
    async (confimed: boolean, modifiedTotalFee?: number, modifiedStorageLimit?: number) => {
      switch (payload.type) {
        case 'connect':
          return confirmDAppPermission(id, confimed, accountPkhToConnect);

        case 'confirm_operations':
          return confirmDAppOperation(id, confimed, modifiedTotalFee, modifiedStorageLimit);

        case 'sign':
          return confirmDAppSign(id, confimed);
      }
    },
    [id, payload.type, confirmDAppPermission, confirmDAppOperation, confirmDAppSign, accountPkhToConnect]
  );

  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

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

  const confirm = useCallback(
    async (confirmed: boolean) => {
      setError(null);
      try {
        await onConfirm(confirmed, modifiedTotalFeeValue - revealFee, modifiedStorageLimitValue);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError(err);
      }
    },
    [onConfirm, setError, modifiedTotalFeeValue, modifiedStorageLimitValue, revealFee]
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

      case 'confirm_operations':
        return {
          title: t('confirmAction', t('operations').toLowerCase()),
          declineActionTitle: t('reject'),
          declineActionTestID: ConfirmPageSelectors.ConfirmOperationsAction_RejectButton,
          confirmActionTitle: error ? t('retry') : t('confirm'),
          confirmActionTestID: error
            ? ConfirmPageSelectors.ConfirmOperationsAction_RetryButton
            : ConfirmPageSelectors.ConfirmOperationsAction_ConfirmButton,
          want: (
            <div className="mb-2 text-sm text-center text-gray-700 flex flex-col items-center">
              <div className="flex items-center justify-center">
                <DAppLogo icon={payload.appMeta.icon} origin={payload.origin} size={16} className="mr-1" />
                <Name className="font-semibold" style={{ maxWidth: '10rem' }}>
                  {payload.appMeta.name}
                </Name>
              </div>
              <T
                id="appRequestOperationToYou"
                substitutions={[
                  <Name className="max-w-full text-xs italic" key="origin">
                    {payload.origin}
                  </Name>
                ]}
              />
            </div>
          )
        };

      case 'sign':
        return {
          title: t('confirmAction', t('signAction').toLowerCase()),
          declineActionTitle: t('reject'),
          declineActionTestID: ConfirmPageSelectors.SignAction_RejectButton,
          confirmActionTitle: t('signAction'),
          confirmActionTestID: ConfirmPageSelectors.SignAction_SignButton,
          want: (
            <div className="mb-2 text-sm text-center text-gray-700 flex flex-col items-center">
              <div className="flex items-center justify-center">
                <DAppLogo icon={payload.appMeta.icon} origin={payload.origin} size={16} className="mr-1" />
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

  return (
    <CustomRpcContext.Provider value={payload.networkRpc}>
      <div
        className="relative bg-white rounded-md shadow-md overflow-y-auto flex flex-col"
        style={{
          width: 380,
          height: 610
        }}
      >
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
                  account={connectedAccount}
                  networkRpc={payload.networkRpc}
                  labelIndent="sm"
                  className="w-full mb-4"
                />
              )}

              <NetworkBanner rpc={payload.networkRpc} narrow={payload.type === 'connect'} />

              <PayloadContent
                error={payloadError}
                payload={payload}
                accountPkhToConnect={accountPkhToConnect}
                setAccountPkhToConnect={setAccountPkhToConnect}
                modifyFeeAndLimit={modifyFeeAndLimit}
              />
            </>
          )}
        </div>

        <div className="flex-1" />

        <div className="sticky bottom-0 w-full bg-white shadow-md flex items-stretch px-4 pt-2 pb-4">
          <div className="w-1/2 pr-2">
            <FormSecondaryButton
              type="button"
              className="justify-center w-full"
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
    </CustomRpcContext.Provider>
  );
};

const AccountIcon: FC<OptionRenderProps<TempleAccount>> = ({ item }) => (
  <Identicon type="bottts" hash={item.publicKeyHash} size={32} className="flex-shrink-0 shadow-xs" />
);

const AccountOptionContentHOC = (networkRpc: string) =>
  memo<OptionRenderProps<TempleAccount>>(({ item: acc }) => {
    const { assetName } = useGasToken();

    return (
      <>
        <div className="flex flex-wrap items-center">
          <Name className="text-sm font-medium leading-tight">{acc.name}</Name>
          <AccountTypeBadge account={acc} />
        </div>

        <div className="flex flex-wrap items-center mt-1">
          <div className="text-xs leading-none text-gray-700">
            <HashShortView hash={acc.publicKeyHash} />
          </div>

          <Balance address={acc.publicKeyHash} networkRpc={networkRpc}>
            {bal => (
              <div className="ml-2 text-xs leading-none flex items-baseline text-gray-600">
                <Money>{bal}</Money>
                <span className="ml-1" style={{ fontSize: '0.75em' }}>
                  {assetName}
                </span>
              </div>
            )}
          </Balance>
        </div>
      </>
    );
  });
