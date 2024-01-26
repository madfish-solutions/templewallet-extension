import React, { FC, ReactNode, useCallback, useEffect, useMemo } from 'react';

import type { TezosToolkit, WalletOperation } from '@taquito/taquito';

import { HashChip, Alert } from 'app/atoms';
import { setTestID } from 'lib/analytics';
import { TzktOperationType } from 'lib/apis/tzkt';
import { T, t } from 'lib/i18n';
import { useTezos, useBlockTriggers, useTzktConnection } from 'lib/temple/front';
import { FailedOpError } from 'lib/temple/operation';
import { useSafeState } from 'lib/ui/hooks';

import { OpenInExplorerChip } from './OpenInExplorerChip';
import { OperationStatusSelectors } from './OperationStatus.selectors';

type OperationStatusProps = {
  className?: string;
  closable?: boolean;
  onClose?: () => void;
  operationsTypes?: TzktOperationType[];
  operationSender?: string;
  typeTitle: string;
  operation: WalletOperation;
};

const OperationStatus: FC<OperationStatusProps> = ({
  typeTitle,
  operation,
  className,
  closable,
  operationsTypes,
  operationSender,
  onClose
}) => {
  const tezos = useTezos();
  const { confirmOperationWithTaquitoAndTriggerNewBlock, confirmOperationWithTzktAndTriggerNewBlock } =
    useBlockTriggers();
  const { connection: tzktConnection, connectionReady: isTzktConnectionReady } = useTzktConnection();

  const confirmOperationAndTriggerNewBlock = useCallback(
    (tezos: TezosToolkit, opHash: string, abortSignal?: AbortSignal) => {
      if (tzktConnection && isTzktConnectionReady) {
        return confirmOperationWithTzktAndTriggerNewBlock(
          opHash,
          tzktConnection,
          operationSender,
          operationsTypes,
          abortSignal
        );
      }

      return confirmOperationWithTaquitoAndTriggerNewBlock(tezos, opHash, { signal: abortSignal });
    },
    [
      confirmOperationWithTaquitoAndTriggerNewBlock,
      confirmOperationWithTzktAndTriggerNewBlock,
      isTzktConnectionReady,
      operationSender,
      operationsTypes,
      tzktConnection
    ]
  );

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

        <HashChip hash={hash} firstCharsCount={10} lastCharsCount={7} small key="hash" className="mx-2" />

        <OpenInExplorerChip hash={hash} small />
      </div>
    ),
    [hash]
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
    const abortCtrl = new AbortController();

    confirmOperationAndTriggerNewBlock(tezos, hash, abortCtrl.signal)
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
          description: err instanceof FailedOpError ? err.message : t('timedOutOperationConfirmation')
        });
      });

    return () => abortCtrl.abort();
  }, [confirmOperationAndTriggerNewBlock, tezos, hash, setAlert, descFooter, typeTitle]);

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
