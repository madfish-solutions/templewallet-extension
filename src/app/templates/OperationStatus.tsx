import React, { FC, ReactNode, useEffect, useMemo } from 'react';

import type { WalletOperation } from '@taquito/taquito';

import { OldStyleHashChip, Alert } from 'app/atoms';
import { setTestID } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useSafeState } from 'lib/ui/hooks';
import { TezosNetworkEssentials } from 'temple/networks';
import { getTezosReadOnlyRpcClient, confirmTezosOperation, TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG } from 'temple/tezos';

import { OpenInExplorerChip } from './OpenInExplorerChip';
import { OperationStatusSelectors } from './OperationStatus.selectors';

interface OperationStatusProps {
  network: TezosNetworkEssentials;
  operation: WalletOperation;
  className?: string;
  closable?: boolean;
  onClose?: () => void;
  typeTitle: string;
}

const OperationStatus: FC<OperationStatusProps> = ({ network, typeTitle, operation, className, closable, onClose }) => {
  const { chainId } = network;

  const hash = useMemo(
    () =>
      // @ts-expect-error
      operation.hash || operation.opHash,
    [operation]
  );

  const descFooter = useMemo(
    () => (
      <div className="mt-2 text-xs flex items-center">
        <div className="whitespace-nowrap">
          <T id="operationHash" />:{' '}
        </div>

        <OldStyleHashChip hash={hash} firstCharsCount={10} lastCharsCount={7} small key="hash" className="mx-2" />

        <OpenInExplorerChip entityType="tx" tezosChainId={chainId} hash={hash} small />
      </div>
    ),
    [hash, chainId]
  );

  const [alert, setAlert] = useSafeState<{
    type: 'success' | 'error';
    title: ReactNode;
    description: ReactNode;
  }>(() => ({
    type: 'success',
    title: <span {...setTestID(OperationStatusSelectors.successEstimatedOperation)}>{`${t('success')} 🛫`}</span>,
    description: (
      <>
        <T id="requestSent" substitutions={typeTitle} />
        {descFooter}
        <div className="flex-1" />
      </>
    )
  }));

  useEffect(() => {
    confirmTezosOperation(getTezosReadOnlyRpcClient(network), hash)
      .then(() => {
        setAlert(a => ({
          ...a,
          title: <span {...setTestID(OperationStatusSelectors.successDoneOperation)}>{`${t('success')} ✅`}</span>,
          description: (
            <>
              <T id="operationSuccessfullyProcessed" substitutions={typeTitle} />
              {descFooter}
            </>
          )
        }));
      })
      .catch((err: any) => {
        setAlert({
          type: 'error',
          title: t('error'),
          description:
            err?.message === TEZOS_CONFIRMATION_TIMED_OUT_ERROR_MSG
              ? t('timedOutOperationConfirmation')
              : err?.message || 'Operation confirmation failed'
        });
      });
  }, [network, hash, setAlert, descFooter, typeTitle]);

  return (
    <Alert
      type={alert.type}
      title={alert.title}
      description={alert.description}
      autoFocus
      className={className}
      closable={closable}
      onClose={onClose}
    />
  );
};

export default OperationStatus;
