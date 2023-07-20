import React, { FC, ReactNode, useEffect, useMemo } from 'react';

import type { WalletOperation } from '@taquito/taquito';

import { HashChip, OpenInExplorerChip, Alert } from 'app/atoms';
import { T, t } from 'lib/i18n';
import { useTezos, useExplorerBaseUrls, useBlockTriggers } from 'lib/temple/front';
import { FailedOpError } from 'lib/temple/operation';
import { useSafeState } from 'lib/ui/hooks';

import { setTestID } from '../../lib/analytics';
import { OperationStatusSelectors } from './OperationStatus.selectors';

type OperationStatusProps = {
  className?: string;
  closable?: boolean;
  onClose?: () => void;
  typeTitle: string;
  operation: WalletOperation;
};

const OperationStatus: FC<OperationStatusProps> = ({ typeTitle, operation, className, closable, onClose }) => {
  const tezos = useTezos();
  const { confirmOperationAndTriggerNewBlock } = useBlockTriggers();

  const hash = useMemo(
    () =>
      // @ts-expect-error
      operation.hash || operation.opHash,
    [operation]
  );

  const { transaction: transactionBaseUrl } = useExplorerBaseUrls();

  const descFooter = useMemo(
    () => (
      <div className="mt-2 text-xs flex items-center">
        <div className="whitespace-nowrap">
          <T id="operationHash" />:{' '}
        </div>
        <HashChip hash={hash} firstCharsCount={10} lastCharsCount={7} small key="hash" className="ml-2 mr-2" />
        {transactionBaseUrl && <OpenInExplorerChip baseUrl={transactionBaseUrl} hash={hash} />}
      </div>
    ),
    [hash, transactionBaseUrl]
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

    confirmOperationAndTriggerNewBlock(tezos, hash, {
      signal: abortCtrl.signal
    })
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
