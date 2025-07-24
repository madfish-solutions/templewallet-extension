import React, { memo, useCallback, useMemo, useState } from 'react';

import {
  Ethereum,
  EthTransaction,
  getEthValidatorsQueueStats,
  WalletSDKError
} from '@temple-wallet/everstake-wallet-sdk';
import { BigNumber } from 'bignumber.js';

import AssetField from 'app/atoms/AssetField';
import { StyledButton } from 'app/atoms/StyledButton';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { toastError, toastSuccess, TxData } from 'app/toaster';
import { formatDuration } from 'lib/i18n/core';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { SOURCE_ID } from './constants';
import { getStakingAPR } from './utils';

export const EthereumContent = memo<{ accountAddress: HexString; ethereumSdk: Ethereum }>(
  ({ accountAddress, ethereumSdk }) => {
    const testnetModeEnabled = useTestnetModeEnabledSelector();
    const [amount, setAmount] = useState('');
    const [actionInProgress, setActionInProgress] = useState(false);
    const { sendEvmTransaction } = useTempleClient();
    const chain = useEvmChainByChainId(testnetModeEnabled ? 17000 : 1);
    const amountBn = useMemo(() => (amount ? new BigNumber(amount) : new BigNumber(NaN)), [amount]);
    const isValidAmount = useMemo(() => amountBn.isFinite() && amountBn.gt(0), [amountBn]);

    const cleanAmount = useCallback(() => setAmount(''), []);

    const getStakesData = useCallback(async () => {
      const [
        {
          balance: poolBalance,
          pendingBalance: poolPendingBalance,
          pendingDepositedBalance: poolPendingDepositedBalance,
          pendingRestakedRewards: poolPendingRestakedReward,
          readyforAutocompoundRewardsAmount: poolReadyAutocompoundBalance
        },
        {
          pendingBalanceOf: userPendingBalance,
          pendingDepositedBalanceOf: userPendingDepositedBalance,
          pendingRestakedRewardOf: userPendingRestakedReward,
          autocompoundBalanceOf: userAutocompoundBalance,
          depositedBalanceOf: userDepositedBalance
        },
        userRestakedReward,
        poolFee,
        withdrawRequestQueueParams,
        userWithdrawRequest,
        minStakeAmount
      ] = await Promise.all([
        ethereumSdk.poolBalances(),
        ethereumSdk.userBalances(accountAddress),
        ethereumSdk.restakedRewardOf(accountAddress),
        ethereumSdk.getPoolFee(),
        ethereumSdk.withdrawRequestQueueParams(),
        ethereumSdk.withdrawRequest(accountAddress),
        ethereumSdk.minStakeAmount()
      ]);

      return {
        poolBalance,
        poolPendingBalance,
        userPendingBalance,
        poolPendingDepositedBalance,
        userPendingDepositedBalance,
        poolPendingRestakedReward,
        userPendingRestakedReward,
        userRestakedReward,
        userDepositedBalance,
        poolFeePercentage: poolFee.times(100),
        poolReadyAutocompoundBalance,
        userAutocompoundBalance,
        withdrawRequestQueueParams,
        userWithdrawRequest,
        minStakeAmount
      };
    }, [accountAddress, ethereumSdk]);
    const { data } = useTypedSWR(['ethereum-stakes', accountAddress, testnetModeEnabled], getStakesData, {
      suspense: true,
      revalidateOnFocus: false,
      refreshInterval: 10000
    });
    const { data: validatorsQueueStats } = useTypedSWR(
      testnetModeEnabled ? null : 'validators-queue-stats',
      getEthValidatorsQueueStats,
      { revalidateOnFocus: false, refreshInterval: 60000 }
    );
    const { data: apr } = useTypedSWR(testnetModeEnabled ? null : 'ethereum-apr', () => getStakingAPR('ethereum'), {
      revalidateOnFocus: false,
      refreshInterval: 60000
    });

    const handleActionFactory = useCallback(
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
      <T extends unknown>(
          actionFn: () => Promise<T>,
          successTitle: (data: T) => string,
          successTxData: (data: T) => TxData | undefined,
          errorMessagePrefix: string
        ) =>
        async () => {
          try {
            setActionInProgress(true);
            const data = await actionFn();
            toastSuccess(successTitle(data), undefined, successTxData(data));
          } catch (error) {
            const originalError = error instanceof WalletSDKError && error.originalError ? error.originalError : error;
            toastError(`${errorMessagePrefix} ${String(originalError)}`);
            console.error(errorMessagePrefix, originalError);
          } finally {
            setActionInProgress(false);
          }
        },
      []
    );
    const handleTxActionFactory = useCallback(
      (createTx: () => Promise<EthTransaction>, errorMessagePrefix: string) =>
        handleActionFactory(
          async () => {
            const { to, from, value, data, gasLimit } = await createTx();

            return await sendEvmTransaction(accountAddress, chain!, {
              to,
              from,
              value: BigInt(value.toFixed()),
              data,
              gas: BigInt(gasLimit)
            });
          },
          () => 'Transaction sent successfully',
          txHash => {
            const explorerUrl = chain?.activeBlockExplorer?.url;

            return explorerUrl
              ? {
                  hash: txHash,
                  blockExplorerHref: `${explorerUrl}/tx/${txHash}`
                }
              : undefined;
          },
          errorMessagePrefix
        ),
      [chain, accountAddress, handleActionFactory, sendEvmTransaction]
    );

    const handleAmountChange = useCallback((value?: string) => {
      setAmount(value ?? '');
    }, []);

    const handleClaimWithdrawalClick = useMemo(
      () =>
        handleTxActionFactory(
          () => ethereumSdk.claimWithdrawRequest(accountAddress),
          'Error while claiming withdrawal:'
        ),
      [accountAddress, ethereumSdk, handleTxActionFactory]
    );

    const handleSimulateUnstakeClick = useMemo(
      () =>
        handleActionFactory(
          () => {
            // eslint-disable-next-line no-debugger
            debugger;

            return ethereumSdk.simulateUnstake(accountAddress, amountBn.toFixed(), undefined, SOURCE_ID);
          },
          result => `${result.toFixed()} ETH will be withdrawn instantly`,
          () => undefined,
          'Error while simulating unstake:'
        ),
      [handleActionFactory, ethereumSdk, accountAddress, amountBn]
    );

    const handleUnstakePendingClick = useMemo(
      () =>
        handleTxActionFactory(
          () => ethereumSdk.unstakePending(accountAddress, amountBn.toFixed()),
          'Error while unstaking pending ETH:'
        ),
      [amountBn, ethereumSdk, accountAddress, handleTxActionFactory]
    );

    const handleUnstakeClick = useMemo(
      () =>
        handleTxActionFactory(
          () => ethereumSdk.unstake(accountAddress, amountBn.toFixed(), undefined, SOURCE_ID),
          'Error while unstaking ETH:'
        ),
      [amountBn, ethereumSdk, accountAddress, handleTxActionFactory]
    );

    const handleStakeClick = useMemo(
      () =>
        handleTxActionFactory(
          () => ethereumSdk.stake(accountAddress, amountBn.toFixed(), SOURCE_ID),
          'Error while staking ETH:'
        ),
      [amountBn, ethereumSdk, accountAddress, handleTxActionFactory]
    );

    const handleActivateStakeClick = useMemo(
      () => handleTxActionFactory(() => ethereumSdk.activateStake(accountAddress), 'Error while activating stake:'),
      [ethereumSdk, accountAddress, handleTxActionFactory]
    );

    if (!data) {
      return <p>No data available</p>;
    }

    const {
      poolBalance,
      poolPendingBalance,
      userPendingBalance,
      poolPendingDepositedBalance,
      userPendingDepositedBalance,
      poolPendingRestakedReward,
      userPendingRestakedReward,
      userRestakedReward,
      userDepositedBalance,
      poolFeePercentage,
      poolReadyAutocompoundBalance,
      userAutocompoundBalance,
      withdrawRequestQueueParams,
      userWithdrawRequest,
      minStakeAmount
    } = data;
    const { requested: requestedWithdrawAmount, readyForClaim: readyForWithdrawalClaimAmount } = userWithdrawRequest;
    const canClaimWithdraw = requestedWithdrawAmount.gt(0) && readyForWithdrawalClaimAmount.eq(requestedWithdrawAmount);

    return (
      <div className="text-font-description flex flex-col gap-1">
        <p className="text-font-regular-bold">Ethereum Staking</p>
        <p>Pool balance: {poolBalance} ETH</p>
        <p>
          Pending balance: {userPendingBalance} / {poolPendingBalance} ETH
        </p>
        <p>
          Pending deposited balance (deposited into the Beacon deposit contract but validators are still not active):{' '}
          {userPendingDepositedBalance} / {poolPendingDepositedBalance} ETH
        </p>
        <p>
          Pending restaked rewards: {userPendingRestakedReward} / {poolPendingRestakedReward} ETH
        </p>
        <p>Your restaked rewards: {userRestakedReward.toFixed()} ETH</p>
        <p>Your deposit: {userDepositedBalance} ETH</p>
        <p>Pool fee: {poolFeePercentage.toFixed()}%</p>
        <p>Total ready for autocompound: {poolReadyAutocompoundBalance} ETH</p>
        <p>Your autocompound balance (including pending): {userAutocompoundBalance} ETH</p>
        <p>Withdraw request queue params:</p>
        <pre className="overflow-auto">{JSON.stringify(withdrawRequestQueueParams, null, 2)}</pre>
        <p>
          Your withdraw request: {requestedWithdrawAmount.toFixed()} ETH, ready for claim:{' '}
          {readyForWithdrawalClaimAmount.toFixed()} ETH
        </p>
        <p>Minimum stake amount: {minStakeAmount.toFixed()} ETH</p>
        {validatorsQueueStats && (
          <>
            <p>
              Stake activation time after deposit:{' '}
              {formatDuration(
                validatorsQueueStats.validator_activation_time + validatorsQueueStats.validator_adding_delay
              )}
            </p>
            <p>
              Withdrawal time after unstake:{' '}
              {formatDuration(validatorsQueueStats.validator_exit_time + validatorsQueueStats.validator_withdraw_time)}
            </p>
          </>
        )}
        {apr && <p>APR: {apr}%</p>}

        <AssetField
          extraFloatingInner="ETH"
          assetDecimals={18}
          readOnly={false}
          placeholder="0.00"
          cleanable
          floatAfterPlaceholder
          onClean={cleanAmount}
          onChange={handleAmountChange}
          value={amount}
        />

        <StyledButton
          color="primary"
          size="S"
          onClick={handleClaimWithdrawalClick}
          disabled={actionInProgress || !canClaimWithdraw}
        >
          Claim withdrawal
        </StyledButton>

        <StyledButton
          color="primary"
          size="S"
          onClick={handleStakeClick}
          disabled={actionInProgress || !isValidAmount || amountBn.lt(minStakeAmount)}
        >
          Stake {amount} ETH
        </StyledButton>

        <StyledButton color="primary" size="S" onClick={handleActivateStakeClick} disabled={actionInProgress}>
          Activate pending stake
        </StyledButton>

        <StyledButton
          color="red"
          size="S"
          onClick={handleUnstakeClick}
          disabled={actionInProgress || !isValidAmount || amountBn.gt(userAutocompoundBalance)}
        >
          Unstake {amount} ETH
        </StyledButton>

        <StyledButton
          color="red"
          size="S"
          onClick={handleSimulateUnstakeClick}
          disabled={actionInProgress || !isValidAmount || amountBn.gt(userAutocompoundBalance)}
        >
          Simulate unstaking {amount} ETH
        </StyledButton>

        <StyledButton
          color="red"
          size="S"
          onClick={handleUnstakePendingClick}
          disabled={actionInProgress || !isValidAmount || amountBn.gt(userPendingBalance)}
        >
          Unstake pending {amount} ETH
        </StyledButton>
      </div>
    );
  }
);
