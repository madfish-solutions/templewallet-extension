import React, { memo, useCallback, useMemo, useState } from 'react';

import { Berrachain, BerachainTransaction, WalletSDKError } from '@temple-wallet/everstake-wallet-sdk';
import { formatUnits } from 'viem';

import AssetField from 'app/atoms/AssetField';
import { StyledButton } from 'app/atoms/StyledButton';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { toastError, toastSuccess } from 'app/toaster';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

export const BerrachainContent = memo<{ accountAddress: HexString; berrachainSdk: Berrachain }>(
  ({ accountAddress, berrachainSdk }) => {
    const testnetModeEnabled = useTestnetModeEnabledSelector();
    const [amount, setAmount] = useState('');
    const [actionInProgress, setActionInProgress] = useState(false);
    const { sendEvmTransaction } = useTempleClient();
    const chain = useEvmChainByChainId(testnetModeEnabled ? 80069 : 80094);
    const isValidAmount = useMemo(() => amount && Number.isFinite(Number(amount)) && Number(amount) > 0, [amount]);

    const cleanAmount = useCallback(() => setAmount(''), []);

    const getStakesData = useCallback(async () => {
      try {
        const [balance, totalStaked, everstakeStaked, stakeQueue, unstakeQueue, activateDelay, currentBlock] =
          await Promise.all([
            berrachainSdk.balanceOf(accountAddress),
            berrachainSdk.getStakes(accountAddress),
            berrachainSdk.getStake(accountAddress),
            berrachainSdk.getStakeInQueue(accountAddress),
            berrachainSdk.getUnstakeInQueue(accountAddress),
            berrachainSdk.getActivateBoostDelay(),
            berrachainSdk.getBlockNumber()
          ]);
        const { lastBlock: lastStakeQueueBlock } = stakeQueue;
        const { lastBlock: lastUnstakeQueueBlock } = unstakeQueue;

        return {
          balance: formatUnits(BigInt(balance), 18),
          totalStaked: formatUnits(BigInt(totalStaked), 18),
          everstakeStaked: formatUnits(BigInt(everstakeStaked), 18),
          stakeQueue,
          unstakeQueue,
          blocksBeforeActivationAvailable: Math.max(0, activateDelay - (Number(currentBlock) - lastStakeQueueBlock)),
          blocksBeforeUnstakeAvailable: Math.max(0, activateDelay - (Number(currentBlock) - lastUnstakeQueueBlock))
        };
      } catch (error) {
        console.error('Error fetching Berrachain data:', error);

        return null;
      }
    }, [berrachainSdk, accountAddress]);

    const { data } = useTypedSWR(['berrachain-stakes', accountAddress, testnetModeEnabled], getStakesData, {
      suspense: true,
      revalidateOnFocus: false,
      refreshInterval: 10000
    });

    const handleActionFactory = useCallback(
      (createTx: () => Promise<BerachainTransaction>, errorMessagePrefix: string) => async () => {
        try {
          setActionInProgress(true);
          const { data, from, to, value, gasLimit } = await createTx();
          const txHash = await sendEvmTransaction(accountAddress, chain!, {
            to,
            from,
            value: BigInt(value.toFixed()),
            data,
            gas: BigInt(gasLimit)
          });
          const explorerUrl = chain?.activeBlockExplorer?.url;
          toastSuccess(
            'Transaction sent successfully',
            undefined,
            explorerUrl
              ? {
                  hash: txHash,
                  blockExplorerHref: `${explorerUrl}/tx/${txHash}`
                }
              : undefined
          );
        } catch (error) {
          const originalError = error instanceof WalletSDKError && error.originalError ? error.originalError : error;
          toastError(`${errorMessagePrefix} ${String(originalError)}`);
          console.error(errorMessagePrefix, originalError);
        } finally {
          setActionInProgress(false);
        }
      },
      [chain, accountAddress, sendEvmTransaction]
    );

    const handleStakeClick = useMemo(
      () => handleActionFactory(() => berrachainSdk.stake(accountAddress, amount), 'Error while staking BER:'),
      [amount, berrachainSdk, accountAddress, handleActionFactory]
    );

    const handleActivateStakeClick = useMemo(
      () => handleActionFactory(() => berrachainSdk.activateStake(accountAddress), 'Error while activating stake:'),
      [berrachainSdk, accountAddress, handleActionFactory]
    );

    const handleCancelUnstakeClick = useMemo(
      () =>
        handleActionFactory(
          () => berrachainSdk.cancelUnstake(accountAddress, amount),
          'Error while canceling unstake:'
        ),
      [amount, berrachainSdk, accountAddress, handleActionFactory]
    );

    const handleUnstakeClick = useMemo(
      () => handleActionFactory(() => berrachainSdk.unstake(accountAddress), 'Error while unstaking BER:'),
      [berrachainSdk, accountAddress, handleActionFactory]
    );

    const handleCancelStakeInQueueClick = useMemo(
      () =>
        handleActionFactory(
          () => berrachainSdk.cancelStakeInQueue(accountAddress, amount),
          'Error while canceling stake in queue:'
        ),
      [amount, berrachainSdk, accountAddress, handleActionFactory]
    );

    const handleQueueUnstakeClick = useMemo(
      () =>
        handleActionFactory(() => berrachainSdk.queueUnstake(accountAddress, amount), 'Error while queuing unstake:'),
      [amount, berrachainSdk, accountAddress, handleActionFactory]
    );

    const handleAmountChange = useCallback((value?: string) => {
      setAmount(value ?? '');
    }, []);

    if (!data) {
      return <p>No data available</p>;
    }

    const {
      balance,
      totalStaked,
      everstakeStaked,
      stakeQueue,
      unstakeQueue,
      blocksBeforeActivationAvailable,
      blocksBeforeUnstakeAvailable
    } = data;

    return (
      <div className="text-font-description flex flex-col gap-1">
        <p className="text-font-regular-bold">Berrachain Staking (Boosting)</p>
        <p>Balance: {balance} BGT</p>
        <p>Total staked: {totalStaked} BGT</p>
        <p>Staked for Everstake: {everstakeStaked} BGT</p>
        <p>Stake queue: {JSON.stringify(stakeQueue)}</p>
        <p>Unstake queue: {JSON.stringify(unstakeQueue)}</p>

        <AssetField
          extraFloatingInner="BGT"
          assetDecimals={18}
          readOnly={false}
          placeholder="0.00"
          cleanable
          floatAfterPlaceholder
          onClean={cleanAmount}
          onChange={handleAmountChange}
          value={amount}
        />

        <StyledButton color="primary" size="S" onClick={handleStakeClick} disabled={actionInProgress || !isValidAmount}>
          Stake {amount} BGT
        </StyledButton>
        {blocksBeforeActivationAvailable === 0 ? (
          <StyledButton color="primary" size="S" onClick={handleActivateStakeClick} disabled={actionInProgress}>
            Activate Stake
          </StyledButton>
        ) : (
          <p>Activation will be available in {blocksBeforeActivationAvailable} blocks</p>
        )}
        <StyledButton
          color="primary"
          size="S"
          onClick={handleCancelUnstakeClick}
          disabled={actionInProgress || !isValidAmount}
        >
          Cancel Unstake for {amount} BGT
        </StyledButton>
        {blocksBeforeUnstakeAvailable === 0 ? (
          <StyledButton color="red" size="S" onClick={handleUnstakeClick} disabled={actionInProgress}>
            Unstake
          </StyledButton>
        ) : (
          <p>Unstake will be available in {blocksBeforeUnstakeAvailable} blocks</p>
        )}
        <StyledButton
          color="red"
          size="S"
          onClick={handleCancelStakeInQueueClick}
          disabled={actionInProgress || !isValidAmount}
        >
          Cancel Stake in Queue for {amount} BGT
        </StyledButton>
        <StyledButton
          color="red"
          size="S"
          onClick={handleQueueUnstakeClick}
          disabled={actionInProgress || !isValidAmount}
        >
          Queue Unstake for {amount} BGT
        </StyledButton>
      </div>
    );
  }
);
