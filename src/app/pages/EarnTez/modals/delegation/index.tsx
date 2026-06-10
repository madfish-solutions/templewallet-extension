import React, { memo, useCallback } from 'react';

import { noop } from 'lodash';

import { PageLoader } from 'app/atoms/Loader';
import { dispatch } from 'app/store';
import {
  addPendingTezosTransactionAction,
  monitorPendingTezosTransactionsAction
} from 'app/store/tezos/pending-transactions/actions';
import { submitDelegation } from 'lib/apis/everstake';
import { T, t } from 'lib/i18n';
import { EVERSTAKE_BAKER_ADDRESS } from 'lib/known-bakers';
import { Baker } from 'lib/temple/front';
import { AccountForTezos } from 'temple/accounts';
import { TezosChain } from 'temple/front';
import { useGetTezosActiveBlockExplorer } from 'temple/front/ready';
import { makeBlockExplorerHref } from 'temple/front/use-block-explorers';
import { TempleChainKind } from 'temple/types';

import { EarnOperationModal, EarnOperationModalProps } from '../../components/earn-operation-modal';
import { getBakerAddress } from '../../utils';

import { ConfirmDelegationContent } from './confirm-delegation-content';
import { SelectBakerContent } from './select-baker-content';
import { ReviewData } from './types';

interface DelegationModalProps {
  account: AccountForTezos;
  network: TezosChain;
  bakerPkh?: string;
  directBakerPkh?: string;
  onClose: EmptyFn;
}

type GenericModalProps = EarnOperationModalProps<string | Baker, ReviewData>;

export const DelegationModal = memo<DelegationModalProps>(({ bakerPkh, directBakerPkh, account, network, onClose }) => {
  const getActiveBlockExplorer = useGetTezosActiveBlockExplorer();

  const LocalSelectBakerContent = useCallback<GenericModalProps['InputDataContent']>(
    ({ onSubmit }) => (
      <SelectBakerContent network={network} account={account} bakerPkh={bakerPkh} onSelect={onSubmit} />
    ),
    [account, bakerPkh, network]
  );

  const AutoSubmitBakerContent = useCallback<GenericModalProps['InputDataContent']>(
    ({ onSubmit }) => {
      if (directBakerPkh) {
        onSubmit(directBakerPkh);
      }
      return null;
    },
    [directBakerPkh]
  );

  const makeReviewData = useCallback<GenericModalProps['makeReviewData']>(
    (data, onSuccess) => ({
      baker: data,
      onConfirm: opHash => {
        onSuccess(opHash);
        if (getBakerAddress(data) === EVERSTAKE_BAKER_ADDRESS) {
          submitDelegation(opHash).catch(noop);
        }
        const blockExplorer = getActiveBlockExplorer(network.chainId);
        dispatch(
          addPendingTezosTransactionAction({
            txHash: opHash,
            accountPkh: account.address,
            network,
            blockExplorerUrl: makeBlockExplorerHref(blockExplorer.url, opHash, 'tx', TempleChainKind.Tezos),
            submittedAt: Date.now(),
            kind: 'delegation'
          })
        );
        dispatch(monitorPendingTezosTransactionsAction());
      },
      network: { ...network, kind: TempleChainKind.Tezos },
      account
    }),
    [account, network, getActiveBlockExplorer]
  );

  return (
    <EarnOperationModal
      inputDataStepTitle={<T id="selectBaker" />}
      confirmStepTitle={<T id="confirmAction" substitutions={<T id="delegation" />} />}
      successToastText={t('successfullyDelegated')}
      network={network}
      isDirectBaker={!!directBakerPkh}
      SuspenseLoader={SuspenseLoader}
      InputDataContent={directBakerPkh ? AutoSubmitBakerContent : LocalSelectBakerContent}
      ConfirmContent={ConfirmDelegationContent}
      makeReviewData={makeReviewData}
      onClose={onClose}
    />
  );
});

const SuspenseLoader: GenericModalProps['SuspenseLoader'] = memo(({ isInputDataStep }) => (
  <PageLoader stretch text={isInputDataStep ? t('bakersAreLoading') : undefined} />
));
