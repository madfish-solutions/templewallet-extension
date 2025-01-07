import React, { FC, useCallback, useEffect, useMemo } from 'react';

import { localForger } from '@taquito/local-forging';
import classNames from 'clsx';

import { Alert, FormSubmitButton, FormSecondaryButton } from 'app/atoms';
import ConfirmLedgerOverlay from 'app/atoms/ConfirmLedgerOverlay';
import { Logo } from 'app/atoms/Logo';
import SubTitle from 'app/atoms/SubTitle';
import { useAppEnv } from 'app/env';
import { ReactComponent as CodeAltIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import { ReactComponent as HashIcon } from 'app/icons/hash.svg';
import { dispatch } from 'app/store';
import { setOnRampPossibilityAction } from 'app/store/settings/actions';
import AccountBanner from 'app/templates/AccountBanner';
import ExpensesView, { ModifyFeeAndLimit } from 'app/templates/ExpensesView/ExpensesView';
import NetworkBanner from 'app/templates/NetworkBanner';
import OperationsBanner from 'app/templates/OperationsBanner/OperationsBanner';
import RawPayloadView from 'app/templates/RawPayloadView';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { ViewsSwitcherItemProps } from 'app/templates/ViewsSwitcher/ViewsSwitcherItem';
import { toTokenSlug } from 'lib/assets';
import { T, t } from 'lib/i18n';
import { useRetryableSWR } from 'lib/swr';
import { tryParseExpenses } from 'lib/temple/front';
import { TempleAccountType, TempleConfirmationPayload } from 'lib/temple/types';
import { useSafeState } from 'lib/ui/hooks';
import { isTruthy } from 'lib/utils';
import { findAccountForTezos } from 'temple/accounts';
import { useTezosChainIdLoadingValue, useRelevantAccounts } from 'temple/front';

import { InternalConfirmationSelectors } from './InternalConfirmation.selectors';

type InternalConfiramtionProps = {
  payload: TempleConfirmationPayload;
  onConfirm: (confirmed: boolean, modifiedTotalFee?: number, modifiedStorageLimit?: number) => Promise<void>;
  error?: any;
};

const MIN_GAS_FEE = 0;

const InternalConfirmation: FC<InternalConfiramtionProps> = ({ payload, onConfirm, error: payloadError }) => {
  const { popup } = useAppEnv();

  const getContentToParse = useCallback(async () => {
    switch (payload.type) {
      case 'operations':
        return payload.opParams || [];
      case 'sign':
        const unsignedBytes = payload.bytes.substr(0, payload.bytes.length - 128);
        try {
          return (await localForger.parse(unsignedBytes)) || [];
        } catch (err: any) {
          console.error(err);
          return [];
        }
      default:
        return [];
    }
  }, [payload]);
  const { data: contentToParse } = useRetryableSWR(['content-to-parse'], getContentToParse, { suspense: true });

  const networkRpc = payload.networkRpc;

  // TODO: `payload.chainId`
  const tezosChainId = useTezosChainIdLoadingValue(networkRpc, true)!;

  const tezosNetwork = useMemo(() => ({ chainId: tezosChainId, rpcBaseURL: networkRpc }), [tezosChainId, networkRpc]);

  const relevantAccounts = useRelevantAccounts(tezosChainId);
  const account = useMemo(
    () => findAccountForTezos(relevantAccounts, payload.sourcePkh)!,
    [relevantAccounts, payload.sourcePkh]
  );

  const rawExpensesData = useMemo(
    () => tryParseExpenses(contentToParse!, account.address),
    [contentToParse, account.address]
  );

  const expensesData = useMemo(() => {
    return rawExpensesData.map(({ expenses, ...restProps }) => ({
      expenses: expenses.map(({ tokenAddress, tokenId, ...restProps }) => ({
        assetSlug: tokenAddress ? toTokenSlug(tokenAddress, tokenId) : 'tez',
        ...restProps
      })),
      ...restProps
    }));
  }, [rawExpensesData]);

  useEffect(() => {
    try {
      const { errorDetails, errors, name } = payloadError.error[0];
      if (
        payload.type !== 'operations' ||
        !errorDetails.toLowerCase().includes('estimation') ||
        name !== 'TezosOperationError' ||
        !Array.isArray(errors)
      ) {
        return;
      }

      const tezBalanceTooLow = errors.some(error => {
        const { id, contract } = error ?? {};

        return id?.includes('balance_too_low') && contract === payload.sourcePkh;
      });

      if (tezBalanceTooLow) {
        dispatch(setOnRampPossibilityAction(true));
      }
    } catch {}
  }, [payload.sourcePkh, payload.type, payloadError]);

  const signPayloadFormats: ViewsSwitcherItemProps[] = useMemo(() => {
    if (payload.type === 'operations') {
      return [
        {
          key: 'preview',
          name: t('preview'),
          Icon: EyeIcon,
          testID: InternalConfirmationSelectors.previewTab
        },
        {
          key: 'raw',
          name: t('raw'),
          Icon: CodeAltIcon,
          testID: InternalConfirmationSelectors.rawTab
        },
        payload.bytesToSign && {
          key: 'bytes',
          name: t('bytes'),
          Icon: HashIcon,
          testID: InternalConfirmationSelectors.bytesTab
        }
      ].filter(isTruthy);
    }

    return [
      {
        key: 'preview',
        name: t('preview'),
        Icon: EyeIcon,
        testID: InternalConfirmationSelectors.previewTab
      },
      {
        key: 'bytes',
        name: t('bytes'),
        Icon: HashIcon,
        testID: InternalConfirmationSelectors.bytesTab
      }
    ];
  }, [payload]);

  const [spFormat, setSpFormat] = useSafeState(signPayloadFormats[0]);
  const [error, setError] = useSafeState<any>(null);
  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const revealFee = useMemo(() => {
    if (
      payload.type === 'operations' &&
      payload.estimates &&
      payload.estimates.length === payload.opParams.length + 1
    ) {
      return payload.estimates[0].suggestedFeeMutez;
    }

    return 0;
  }, [payload]);

  const [modifiedTotalFeeValue, setModifiedTotalFeeValue] = useSafeState(
    (payload.type === 'operations' &&
      payload.opParams &&
      payload.opParams.reduce((sum, op) => sum + (op.fee ? +op.fee : 0), 0) + revealFee) ||
      0
  );
  const [modifiedStorageLimitValue, setModifiedStorageLimitValue] = useSafeState(
    (payload.type === 'operations' && payload.opParams && payload.opParams[0].storageLimit) || 0
  );

  const gasFeeError = useMemo(() => modifiedTotalFeeValue <= MIN_GAS_FEE, [modifiedTotalFeeValue]);

  const confirm = useCallback(
    async (confirmed: boolean) => {
      setError(null);

      try {
        await onConfirm(confirmed, modifiedTotalFeeValue - revealFee, modifiedStorageLimitValue);
      } catch (err) {
        console.error(err);
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

  const modifiedStorageLimitDisplayed = useMemo(
    () => payload.type === 'operations' && payload.opParams && payload.opParams.length < 2,
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
    <div className={classNames('h-full w-full max-w-sm mx-auto flex flex-col', !popup && 'justify-center px-2')}>
      <div className={classNames('flex flex-col items-center justify-center', popup && 'flex-1')}>
        <div className="flex items-center my-4">
          <Logo className="my-1.5" type="icon-title" />
        </div>
      </div>

      <div
        className={classNames(
          'flex flex-col relative bg-white shadow-md overflow-y-auto',
          popup ? 'border-t border-gray-200' : 'rounded-md'
        )}
        style={{ height: '34rem' }}
      >
        <div className="px-4 pt-3">
          <SubTitle small className="mb-4">
            <T id="confirmAction" substitutions={t(payload.type === 'sign' ? 'signAction' : 'operations')} />
          </SubTitle>

          {error ? (
            <Alert
              closable
              onClose={handleErrorAlertClose}
              type="error"
              title={t('error')}
              description={error?.message ?? t('smthWentWrong')}
              className="my-4"
              autoFocus
            />
          ) : (
            <>
              <AccountBanner account={account} className="w-full mb-4" smallLabelIndent />

              <NetworkBanner network={tezosNetwork} />

              {signPayloadFormats.length > 1 && (
                <div className="w-full flex justify-end mb-3 items-center">
                  <span className="mr-2 text-base font-semibold text-gray-700">
                    <T id="operations" />
                  </span>

                  <div className="flex-1" />

                  <ViewsSwitcher activeItem={spFormat} items={signPayloadFormats} onChange={setSpFormat} />
                </div>
              )}

              {payload.type === 'operations' && spFormat.key === 'raw' && (
                <OperationsBanner
                  opParams={payload.rawToSign ?? payload.opParams}
                  jsonViewStyle={signPayloadFormats.length > 1 ? { height: '11rem' } : undefined}
                  modifiedTotalFee={modifiedTotalFeeValue}
                  modifiedStorageLimit={modifiedStorageLimitValue}
                />
              )}

              {payload.type === 'sign' && spFormat.key === 'bytes' && (
                <>
                  <RawPayloadView
                    label={t('payloadToSign')}
                    payload={payload.bytes}
                    className="mb-4"
                    style={{ height: '11rem' }}
                  />
                </>
              )}

              {payload.type === 'operations' && payload.bytesToSign && spFormat.key === 'bytes' && (
                <>
                  <RawPayloadView payload={payload.bytesToSign} className="mb-4" style={{ height: '11rem' }} />
                </>
              )}

              {spFormat.key === 'preview' && (
                <ExpensesView
                  tezosNetwork={tezosNetwork}
                  expenses={expensesData}
                  error={payloadError}
                  estimates={payload.type === 'operations' ? payload.estimates : undefined}
                  modifyFeeAndLimit={modifyFeeAndLimit}
                  gasFeeError={gasFeeError}
                />
              )}
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
              disabled={declining}
              onClick={handleDeclineClick}
              testID={InternalConfirmationSelectors.declineButton}
            >
              <T id="decline" />
            </FormSecondaryButton>
          </div>

          <div className="w-1/2 pl-2">
            <FormSubmitButton
              type="button"
              className="justify-center w-full"
              disabled={gasFeeError}
              loading={confirming}
              onClick={handleConfirmClick}
              testID={error ? InternalConfirmationSelectors.retryButton : InternalConfirmationSelectors.confirmButton}
            >
              <T id={error ? 'retry' : 'confirm'} />
            </FormSubmitButton>
          </div>
        </div>

        <ConfirmLedgerOverlay displayed={confirming && account.type === TempleAccountType.Ledger} />
      </div>
    </div>
  );
};

export default InternalConfirmation;
