import React, { memo, useCallback } from 'react';

import { PageLoader } from 'app/atoms/Loader';
import { T, t } from 'lib/i18n';
import { Baker } from 'lib/temple/front';
import { AccountForTezos } from 'temple/accounts';
import { TezosChain } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { EarnOperationModal, EarnOperationModalProps } from '../../components/earn-operation-modal';

import { ConfirmDelegationContent } from './confirm-delegation-content';
import { SelectBakerContent } from './select-baker-content';
import { ReviewData } from './types';

interface DelegationModalProps {
  account: AccountForTezos;
  network: TezosChain;
  bakerPkh?: string;
  onClose: EmptyFn;
}

type GenericModalProps = EarnOperationModalProps<string | Baker, ReviewData>;

export const DelegationModal = memo<DelegationModalProps>(({ bakerPkh, account, network, onClose }) => {
  const LocalSelectBakerContent = useCallback<GenericModalProps['InputDataContent']>(
    ({ onSubmit }) => (
      <SelectBakerContent network={network} account={account} bakerPkh={bakerPkh} onSelect={onSubmit} />
    ),
    [account, bakerPkh, network]
  );

  const makeReviewData = useCallback<GenericModalProps['makeReviewData']>(
    (data, onSuccess) => ({
      baker: data,
      onConfirm: onSuccess,
      network: { ...network, kind: TempleChainKind.Tezos },
      account
    }),
    [account, network]
  );

  return (
    <EarnOperationModal
      inputDataStepTitle={<T id="selectBaker" />}
      confirmStepTitle={<T id="confirmAction" substitutions={<T id="delegation" />} />}
      successToastText={t('successfullyDelegated')}
      showTxHash={false}
      network={network}
      SuspenseLoader={SuspenseLoader}
      InputDataContent={LocalSelectBakerContent}
      ConfirmContent={ConfirmDelegationContent}
      makeReviewData={makeReviewData}
      onClose={onClose}
    />
  );
});

const SuspenseLoader: GenericModalProps['SuspenseLoader'] = memo(({ isInputDataStep }) => (
  <PageLoader stretch text={isInputDataStep ? t('bakersAreLoading') : undefined} />
));
