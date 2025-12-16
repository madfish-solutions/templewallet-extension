import React, { memo, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import { TEZ_TOKEN_SLUG, toPenny } from 'lib/assets';
import { useTezosAssetBalance } from 'lib/balances';
import { RECOMMENDED_ADD_TEZ_GAS_FEE } from 'lib/constants';
import { T } from 'lib/i18n';
import { useTezosGasMetadata } from 'lib/metadata';
import { getTezosMaxAmountToken } from 'lib/utils/get-tezos-max-amount-token';
import { ZERO } from 'lib/utils/numbers';
import { AccountForTezos } from 'temple/accounts';
import { getTezosToolkitWithSigner } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';

import { AmountInputContent } from '../../components/amount-input-content';

import { StakeModalSelectors } from './selectors';
import { useStakingEstimationData } from './use-staking-estimation-data';

interface FormValues {
  amount: string;
}

interface AmountInputContentProps {
  account: AccountForTezos;
  bakerPkh: string;
  network: TezosNetworkEssentials;
  onSubmit: SyncFn<FormValues>;
}

export const StakeAmountInputContent = memo<AmountInputContentProps>(({ account, bakerPkh, network, onSubmit }) => {
  const { address: accountPkh } = account;
  const tezos = getTezosToolkitWithSigner(network, accountPkh);

  const { value: tezBalance = ZERO } = useTezosAssetBalance(TEZ_TOKEN_SLUG, accountPkh, network);

  const tezGasMetadata = useTezosGasMetadata(network.chainId);
  const penny = useMemo(() => toPenny(tezGasMetadata), [tezGasMetadata]);

  const stakingEstimationInput = useMemo(
    () => ({
      amount: BigNumber.max(tezBalance.minus(penny), penny),
      account,
      network
    }),
    [account, network, penny, tezBalance]
  );
  const { data: estimationData } = useStakingEstimationData(stakingEstimationInput, tezos, tezBalance);

  const maxAmount = useMemo(
    () =>
      estimationData
        ? getTezosMaxAmountToken(account.type, tezBalance, estimationData.baseFee, RECOMMENDED_ADD_TEZ_GAS_FEE, penny)
        : tezBalance,
    [account.type, estimationData, penny, tezBalance]
  );

  return (
    <AmountInputContent
      formId="stake-amount-form"
      submitButtonTestID={StakeModalSelectors.stakeButton}
      submitButtonLabel={<T id="stake" />}
      maxAmountLabel={<T id="balance" />}
      maxAmount={maxAmount}
      maxAmountLabelValue={tezBalance}
      maxButtonTestID={StakeModalSelectors.maxButton}
      amountInputTestID={StakeModalSelectors.amountInput}
      network={network}
      bakerPkh={bakerPkh}
      accountPkh={accountPkh}
      onSubmit={onSubmit}
    />
  );
});
