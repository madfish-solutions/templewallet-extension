import React, { memo, useMemo } from 'react';

import { Alert } from 'app/atoms';
import { useStakedAmount } from 'app/hooks/use-baking-hooks';
import { T } from 'lib/i18n';
import { mutezToTz } from 'lib/temple/helpers';
import { ZERO } from 'lib/utils/numbers';
import { AccountForTezos } from 'temple/accounts';
import { TezosNetworkEssentials } from 'temple/networks';

import { AmountInputContent } from '../../components/amount-input-content';

import { UnstakeModalSelectors } from './selectors';

interface FormValues {
  amount: string;
}

interface AmountInputContentProps {
  account: AccountForTezos;
  bakerPkh: string;
  network: TezosNetworkEssentials;
  onSubmit: SyncFn<FormValues>;
}

export const UnstakeAmountInputContent = memo<AmountInputContentProps>(({ account, bakerPkh, network, onSubmit }) => {
  const { address: accountPkh } = account;

  const { data: stakedAtomicAmount } = useStakedAmount(network, accountPkh, true);

  const maxAmount = useMemo(() => mutezToTz(stakedAtomicAmount ?? ZERO), [stakedAtomicAmount]);

  return (
    <AmountInputContent
      formId="unstake-amount-form"
      submitButtonTestID={UnstakeModalSelectors.unstakeButton}
      submitButtonLabel={<T id="unstake" />}
      maxAmountLabel={<T id="available" />}
      maxAmount={maxAmount}
      maxButtonTestID={UnstakeModalSelectors.maxButton}
      amountInputTestID={UnstakeModalSelectors.amountInput}
      network={network}
      bakerPkh={bakerPkh}
      accountPkh={accountPkh}
      onSubmit={onSubmit}
    >
      <Alert className="mb-4" type="info" description={<T id="newUnstakeInfo" />} />
    </AmountInputContent>
  );
});
