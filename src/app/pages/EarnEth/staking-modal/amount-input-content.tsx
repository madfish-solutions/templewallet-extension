import React, { memo, useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { formatUnits } from 'viem';

import { dispatch } from 'app/store';
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { isWertSupportedChainAssetSlug } from 'lib/apis/wert';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { toChainAssetSlug } from 'lib/assets/utils';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { T, t } from 'lib/i18n';
import { useEvmGasMetadata } from 'lib/metadata';
import { ZERO } from 'lib/utils/numbers';
import { AccountForEvm } from 'temple/accounts';
import { EvmChain } from 'temple/front';
import { DEFAULT_EVM_CURRENCY } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { AmountInputContent } from '../components/amount-input-content';
import { EthStakingStats } from '../types';

import { StakeEthModalSelectors } from './selectors';
import { useStakingEstimationData } from './use-staking-estimation-data';

interface FormValues {
  amount: string;
}

interface AmountInputContentProps {
  account: AccountForEvm;
  chain: EvmChain;
  stats: EthStakingStats;
  onSubmit: SyncFn<FormValues>;
}

export const StakeAmountInputContent = memo<AmountInputContentProps>(({ account, chain, stats, onSubmit }) => {
  const { address: accountPkh } = account;

  const { value: ethBalance = ZERO } = useEvmAssetBalance(EVM_TOKEN_SLUG, accountPkh as HexString, chain);

  const { symbol: ethSymbol = DEFAULT_EVM_CURRENCY.symbol, decimals: ethDecimals = DEFAULT_EVM_CURRENCY.decimals } =
    useEvmGasMetadata(chain.chainId) ?? {};
  const stakingEstimationInput = useMemo(
    () => ({
      amount: stats.minStakeAmount,
      account,
      network: chain
    }),
    [account, chain, stats.minStakeAmount]
  );
  const { data: estimationData } = useStakingEstimationData(stakingEstimationInput, chain, ethBalance);

  const maxAmount = useMemo(
    () =>
      estimationData
        ? BigNumber.max(0, ethBalance.minus(formatUnits(estimationData.estimatedFee, ethDecimals)))
        : ethBalance,
    [estimationData, ethBalance, ethDecimals]
  );

  const handleExceedMaxAmount = useCallback(() => {
    const chainAssetSlug = toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG);

    isWertSupportedChainAssetSlug(chainAssetSlug) &&
      dispatch(setOnRampAssetAction({ chainAssetSlug, title: t('insufficientAssetBalance', ethSymbol) }));
  }, [chain.chainId, ethSymbol]);
  const handleBelowMinAmount = useCallback(() => {
    const chainAssetSlug = toChainAssetSlug(TempleChainKind.EVM, chain.chainId, EVM_TOKEN_SLUG);

    isWertSupportedChainAssetSlug(chainAssetSlug) &&
      maxAmount.lt(stats.minStakeAmount) &&
      dispatch(setOnRampAssetAction({ chainAssetSlug, title: t('insufficientAssetBalance', ethSymbol) }));
  }, [chain.chainId, maxAmount, stats.minStakeAmount, ethSymbol]);

  return (
    <AmountInputContent
      formId="stake-amount-form"
      submitButtonTestID={StakeEthModalSelectors.stakeButton}
      submitButtonLabel={<T id="stake" />}
      maxAmountLabel={<T id="balance" />}
      maxAmount={maxAmount}
      maxAmountLabelValue={ethBalance}
      minAmount={stats.minStakeAmount}
      maxButtonTestID={StakeEthModalSelectors.maxButton}
      amountInputTestID={StakeEthModalSelectors.amountInput}
      placeholder={`Min ${stats.minStakeAmount}`}
      network={chain}
      stats={stats}
      onSubmit={onSubmit}
      onExceedMaxAmount={handleExceedMaxAmount}
      onBelowMinAmount={handleBelowMinAmount}
    />
  );
});
