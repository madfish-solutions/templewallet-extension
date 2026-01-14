import React, { ReactNode, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Alert, Anchor, IconBase } from 'app/atoms';
import DAppLogo from 'app/atoms/DAppLogo';
import { Logo } from 'app/atoms/Logo';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { ProgressAndNumbers } from 'app/atoms/ProgressAndNumbers';
import { StyledButton } from 'app/atoms/StyledButton';
import { useAppEnv } from 'app/env';
import { useLedgerApprovalModalState } from 'app/hooks/use-ledger-approval-modal-state';
import { ReactComponent as LinkIcon } from 'app/icons/base/link.svg';
import { ReactComponent as OutLinkIcon } from 'app/icons/base/outLink.svg';
import PageLayout from 'app/layouts/PageLayout';
import { AccountsModal } from 'app/templates/AccountsModal';
import { LedgerApprovalModal } from 'app/templates/ledger-approval-modal';
import { EvmOperationKind, getOperationKind } from 'lib/evm/on-chain/transactions';
import { equalsIgnoreCase } from 'lib/evm/on-chain/utils/common.utils';
import { parseEvmTxRequest } from 'lib/evm/on-chain/utils/parse-evm-tx-request';
import { T, t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { StoredAccount, TempleAccountType, TempleDAppPayload, TempleMessageType } from 'lib/temple/types';
import { LedgerOperationState, runConnectedLedgerOperationFlow } from 'lib/ui';
import { useBooleanState, useSafeState } from 'lib/ui/hooks';
import { useLedgerWebHidFullViewGuard } from 'lib/ui/ledger-webhid-guard';
import { LedgerFullViewPromptModal } from 'lib/ui/LedgerFullViewPrompt';
import { delay } from 'lib/utils';
import { getAccountForEvm, getAccountForTezos } from 'temple/accounts';
import { useCurrentAccountId } from 'temple/front';
import { makeIntercomRequest } from 'temple/front/intercom-client';
import { TempleChainKind } from 'temple/types';

import { useAddAsset } from './add-asset/context';
import { ConfirmPageSelectors } from './selectors';

export interface ConfirmDAppFormContentProps {
  selectedAccount: StoredAccount;
  error: any;
  setError: SyncFn<any>;
  formId: string;
  openAccountsModal: EmptyFn;
  onSubmit: EmptyFn;
  dismissConflict?: EmptyFn;
  conflictVisible?: boolean;
  showConflict?: boolean;
  confirmationId: string;
}

interface ConfirmDAppFormProps {
  accounts: StoredAccount[];
  payload: TempleDAppPayload;
  confirmationId: string;
  onConfirm: (confirmed: boolean, selectedAccount: StoredAccount) => Promise<void>;
  children: (props: ConfirmDAppFormContentProps) => ReactChildren;
}

const CONFIRM_OPERATIONS_FORM_ID = 'confirm-operations-form';

const isConnectPayload = (p: TempleDAppPayload): p is Extract<TempleDAppPayload, { type: 'connect' }> =>
  p.type === 'connect';

const evmOperationTitles: Record<EvmOperationKind, ReactNode> = {
  [EvmOperationKind.DeployContract]: <T id="deployContract" />,
  [EvmOperationKind.Mint]: <T id="mint" />,
  [EvmOperationKind.Send]: <T id="send" />,
  [EvmOperationKind.Other]: <T id="unknownTransaction" />,
  [EvmOperationKind.Approval]: <T id="approval" />,
  [EvmOperationKind.ApprovalForAll]: <T id="confirmAction" substitutions={<T id="transfer" />} />
};

const ledgerInteractingPayloadTypes: TempleDAppPayload['type'][] = [
  'confirm_operations',
  'personal_sign',
  'sign',
  'sign_typed'
];

export const ConfirmDAppForm = memo<ConfirmDAppFormProps>(
  ({ accounts, payload, confirmationId, onConfirm, children }) => {
    const [accountsModalIsOpen, openAccountsModal, closeAccountsModal] = useBooleanState(false);
    const [isConfirming, setIsConfirming] = useSafeState(false);
    const [isDeclining, setIsDeclining] = useSafeState(false);
    const [error, setError] = useSafeState<any>(null);
    const { ledgerApprovalModalState, setLedgerApprovalModalState, handleLedgerModalClose } =
      useLedgerApprovalModalState();

    const [bottomEdgeIsVisible, setBottomEdgeIsVisible] = useState(true);
    const { confirmWindow, fullPage } = useAppEnv();

    const { errorMessage: addAssetErrorMessage } = useAddAsset();

    const currentAccountId = useCurrentAccountId();

    const payloadAccountId = useMemo(() => {
      if (payload.chainType === TempleChainKind.EVM) {
        if (payload.type === 'confirm_operations') {
          const from = payload.req.from;

          if (from) {
            const evmAccount = accounts.find(acc => equalsIgnoreCase(getAccountForEvm(acc)?.address, from));
            return evmAccount?.id;
          }
        }

        if ('sourcePkh' in payload) {
          const sourcePkh = payload.sourcePkh;

          const evmAccount = accounts.find(acc => equalsIgnoreCase(getAccountForEvm(acc)?.address, sourcePkh));
          return evmAccount?.id;
        }

        return undefined;
      }

      if ('sourcePkh' in payload) {
        const sourcePkh = payload.sourcePkh;

        const tezosAccount = accounts.find(acc => equalsIgnoreCase(getAccountForTezos(acc)?.address, sourcePkh));
        return tezosAccount?.id;
      }

      return undefined;
    }, [accounts, payload]);

    const selectedAccountId = useMemo(() => {
      if (payloadAccountId && accounts.some(account => account.id === payloadAccountId)) {
        return payloadAccountId;
      }

      return accounts.some(account => account.id === currentAccountId) ? currentAccountId : accounts[0].id;
    }, [accounts, currentAccountId, payloadAccountId]);

    const selectedAccount = useMemo(
      () => accounts.find(account => account.id === selectedAccountId)!,
      [accounts, selectedAccountId]
    );

    const { dAppQueueCounters } = useTempleClient();
    const { length: requestsLeft, maxLength: totalRequestsCount } = dAppQueueCounters;
    const ledgerConfirmationRequired =
      ledgerInteractingPayloadTypes.some(payloadType => payload.type === payloadType) &&
      selectedAccount.type === TempleAccountType.Ledger;
    const [ledgerGuardedForAccountId, setLedgerGuardedForAccountId] = useState<string | null>(null);
    const { guard, preconnectIfNeeded, ledgerPromptProps } = useLedgerWebHidFullViewGuard();

    const detachConfirmWindow = useCallback(async () => {
      await makeIntercomRequest({
        type: TempleMessageType.ConfirmationWindowDetachRequest,
        id: confirmationId
      });
    }, [confirmationId]);

    useEffect(() => {
      if (!ledgerConfirmationRequired) return;
      if (ledgerGuardedForAccountId === selectedAccount.id) return;

      setLedgerGuardedForAccountId(selectedAccount.id);

      void (async () => {
        await guard(selectedAccount.type, {
          onBeforeFullView: detachConfirmWindow,
          useConfirmFullView: true
        });
      })();
    }, [
      detachConfirmWindow,
      guard,
      ledgerConfirmationRequired,
      ledgerGuardedForAccountId,
      selectedAccount.id,
      selectedAccount.type
    ]);

    const shouldShowProgress =
      payload.type !== 'connect' &&
      payload.type !== 'add_chain' &&
      payload.type !== 'add_asset' &&
      totalRequestsCount > 1;

    const confirm = useCallback(
      async (confirmed: boolean) => {
        const doOperation = async () => {
          setError(null);
          await onConfirm(confirmed, selectedAccount);
        };

        try {
          if (ledgerConfirmationRequired && confirmed) {
            setLedgerApprovalModalState(LedgerOperationState.InProgress);
            await preconnectIfNeeded(selectedAccount.type, selectedAccount.chain);
            await runConnectedLedgerOperationFlow(doOperation, setLedgerApprovalModalState, true);
          } else {
            await doOperation();
          }

          if (confirmWindow && fullPage) {
            window.close();
          }
        } catch (err: any) {
          console.error(err);

          // Human delay.
          await delay();
          setError(err);
        }
      },
      [
        confirmWindow,
        fullPage,
        ledgerConfirmationRequired,
        onConfirm,
        preconnectIfNeeded,
        selectedAccount,
        setError,
        setLedgerApprovalModalState
      ]
    );

    const handleConfirmClick = useCallback(async () => {
      if (isConfirming || isDeclining) return;

      if (ledgerConfirmationRequired) {
        const redirected = await guard(selectedAccount.type, {
          onBeforeFullView: detachConfirmWindow,
          useConfirmFullView: true
        });
        if (redirected) return;
      }

      setIsConfirming(true);
      await confirm(true);
      setIsConfirming(false);
    }, [
      isConfirming,
      isDeclining,
      ledgerConfirmationRequired,
      setIsConfirming,
      confirm,
      guard,
      selectedAccount.type,
      detachConfirmWindow
    ]);

    const handleDeclineClick = useCallback(async () => {
      if (isConfirming || isDeclining) return;

      setIsDeclining(true);
      await confirm(false);
      setIsDeclining(false);
    }, [confirm, isConfirming, isDeclining, setIsDeclining]);

    const handleErrorAlertClose = useCallback(() => setError(null), [setError]);

    const shouldShowConflict = useMemo(() => {
      if (!isConnectPayload(payload)) return false;

      const providers = 'providers' in payload ? payload.providers : undefined;
      return Array.isArray(providers) && providers.length > 0;
    }, [payload]);

    const [showConflict, setShowConflict] = useSafeState(shouldShowConflict);

    const { title, confirmButtonName, confirmTestID, declineTestID, confirmDisabled } = useMemo(() => {
      switch (payload.type) {
        case 'connect':
          return {
            title: <T id={showConflict ? 'connectWallet' : 'connectAccount'} />,
            confirmButtonName: <T id={error ? 'retry' : 'connect'} />,
            confirmTestID: error
              ? ConfirmPageSelectors.ConnectAction_RetryButton
              : ConfirmPageSelectors.ConnectAction_ConnectButton,
            declineTestID: ConfirmPageSelectors.ConnectAction_CancelButton
          };
        case 'sign_typed':
        case 'personal_sign':
        case 'sign':
          return {
            title: <T id="signatureRequest" />,
            confirmButtonName: <T id="signAction" />,
            confirmTestID: ConfirmPageSelectors.SignAction_SignButton,
            declineTestID: ConfirmPageSelectors.SignAction_RejectButton
          };
        case 'add_asset':
          return {
            title: <T id="addToken" />,
            confirmButtonName: <T id={error ? 'retry' : 'confirm'} />,
            confirmTestID: error
              ? ConfirmPageSelectors.ConfirmOperationsAction_RetryButton
              : ConfirmPageSelectors.ConfirmOperationsAction_ConfirmButton,
            declineTestID: ConfirmPageSelectors.ConfirmOperationsAction_RejectButton,
            confirmDisabled: Boolean(addAssetErrorMessage)
          };
        case 'add_chain':
          return {
            title: <T id="addNetwork" />,
            confirmButtonName: <T id={error ? 'retry' : 'confirm'} />,
            confirmTestID: error
              ? ConfirmPageSelectors.ConfirmOperationsAction_RetryButton
              : ConfirmPageSelectors.ConfirmOperationsAction_ConfirmButton,
            declineTestID: ConfirmPageSelectors.ConfirmOperationsAction_RejectButton
          };
        default:
          return {
            title:
              payload.chainType === TempleChainKind.EVM ? (
                evmOperationTitles[getOperationKind(parseEvmTxRequest(payload).txSerializable)]
              ) : (
                <T id="confirmAction" substitutions={<T id="operation" />} />
              ),
            confirmButtonName: <T id={error ? 'retry' : 'confirm'} />,
            confirmTestID: error
              ? ConfirmPageSelectors.ConfirmOperationsAction_RetryButton
              : ConfirmPageSelectors.ConfirmOperationsAction_ConfirmButton,
            declineTestID: ConfirmPageSelectors.ConfirmOperationsAction_RejectButton
          };
      }
    }, [payload, error, addAssetErrorMessage, showConflict]);

    const isOperationsConfirm = payload.type === 'confirm_operations';
    const isSignPayload = payload.type === 'sign' || payload.type === 'personal_sign' || payload.type === 'sign_typed';

    return (
      <PageLayout
        pageTitle={title}
        headerLeftElem={
          shouldShowProgress ? (
            <ProgressAndNumbers progress={totalRequestsCount - requestsLeft + 1} total={totalRequestsCount} />
          ) : null
        }
        shouldShowBackButton={false}
        contentPadding={false}
        onBottomEdgeVisibilityChange={setBottomEdgeIsVisible}
        bottomEdgeThreshold={16}
      >
        <div className="flex-1 p-4 gap-4">
          {!showConflict && payload.type !== 'add_asset' && (
            <div className="mb-4 mx-3 flex items-center justify-between">
              <div className="flex items-center">
                <Logo size={22} type="icon" />
                <IconBase Icon={LinkIcon} size={12} className="text-black -ml-1 mr-0.5" />
                <DAppLogo size={24} icon={payload.appMeta.icon} origin={payload.origin} />
              </div>

              <Anchor className="flex pl-1 items-center" href={payload.origin}>
                <span className="text-font-description-bold">{payload.appMeta.name}</span>
                <IconBase Icon={OutLinkIcon} size={16} className="text-secondary" />
              </Anchor>
            </div>
          )}

          {error && !isOperationsConfirm && !isSignPayload && (
            <Alert
              closable
              onClose={handleErrorAlertClose}
              type="error"
              title="Error"
              description={error?.message ?? t('smthWentWrong')}
              autoFocus
            />
          )}

          {children({
            openAccountsModal,
            selectedAccount,
            formId: CONFIRM_OPERATIONS_FORM_ID,
            onSubmit: handleConfirmClick,
            error,
            setError,
            dismissConflict: () => {
              setShowConflict(false);
            },
            showConflict,
            confirmationId
          })}
        </div>

        {!showConflict && (
          <ActionsButtonsBox
            flexDirection="row"
            className="sticky left-0 bottom-0"
            shouldCastShadow={!bottomEdgeIsVisible}
          >
            <StyledButton
              key="cancel"
              size="L"
              color="primary-low"
              className="w-full"
              loading={isDeclining}
              testID={declineTestID}
              onClick={handleDeclineClick}
            >
              <T id="cancel" />
            </StyledButton>

            <StyledButton
              key="confirm"
              size="L"
              color="primary"
              className="w-full"
              loading={isConfirming}
              testID={confirmTestID}
              type={isOperationsConfirm ? 'submit' : 'button'}
              onClick={isOperationsConfirm ? undefined : handleConfirmClick}
              form={isOperationsConfirm ? CONFIRM_OPERATIONS_FORM_ID : undefined}
              disabled={confirmDisabled}
            >
              {confirmButtonName}
            </StyledButton>
          </ActionsButtonsBox>
        )}

        <AccountsModal
          accounts={accounts}
          currentAccountId={selectedAccountId}
          opened={accountsModalIsOpen}
          onRequestClose={closeAccountsModal}
        />

        <LedgerApprovalModal
          state={ledgerApprovalModalState}
          onClose={handleLedgerModalClose}
          chainKind={payload.chainType}
        />
        <LedgerFullViewPromptModal {...ledgerPromptProps} />
      </PageLayout>
    );
  }
);
