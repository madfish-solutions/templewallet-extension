import React, { memo, useCallback, useMemo, useState } from 'react';

import {
  createToken,
  Polygon,
  POLYGON_MIN_AMOUNT,
  POLYGON_WITHDRAW_EPOCH_DELAY,
  PolygonTransactionRequest,
  WalletSDKError
} from '@temple-wallet/everstake-wallet-sdk';
import BigNumber from 'bignumber.js';

import AssetField from 'app/atoms/AssetField';
import { StyledButton } from 'app/atoms/StyledButton';
import { toastError, toastSuccess } from 'app/toaster';
import { formatDuration } from 'lib/i18n/core';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { ETHEREUM_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { useEvmChainByChainId } from 'temple/front/chains';

import { getStakingAPR } from './utils';

const minPolAmount = POLYGON_MIN_AMOUNT.shiftedBy(-18);

const getAuthToken = async () => await createToken('Temple Wallet', 'SDK');

export const PolygonContent = memo<{ accountAddress: HexString; polygonSdk: Polygon }>(
  ({ accountAddress, polygonSdk }) => {
    const [amount, setAmount] = useState('');
    const [actionInProgress, setActionInProgress] = useState(false);
    const { sendEvmTransaction } = useTempleClient();
    const chain = useEvmChainByChainId(ETHEREUM_MAINNET_CHAIN_ID);
    const amountBn = useMemo(() => (amount ? new BigNumber(amount) : new BigNumber(NaN)), [amount]);
    const isValidAmount = useMemo(() => amountBn.isFinite() && amountBn.gte(0), [amountBn]);

    const cleanAmount = useCallback(() => setAmount(''), []);

    const getStakesData = useCallback(async () => {
      try {
        const [reward, maticAllowance, polAllowance, totalDelegated, unbond, currentEpoch] = await Promise.all([
          polygonSdk.getReward(accountAddress),
          polygonSdk.getAllowance(accountAddress, false),
          polygonSdk.getAllowance(accountAddress, true),
          polygonSdk.getTotalDelegate(accountAddress),
          polygonSdk.getUnbond(accountAddress),
          polygonSdk.getCurrentEpoch()
        ]);

        return {
          reward,
          maticAllowance: new BigNumber(maticAllowance.toString()).shiftedBy(-18),
          polAllowance: new BigNumber(polAllowance.toString()).shiftedBy(-18),
          totalDelegated,
          unbond: {
            amount: unbond.amount,
            withdrawEpoch: unbond.withdrawEpoch,
            unbondNonces: unbond.unbondNonces.toString()
          },
          currentEpoch
        };
      } catch (error) {
        const originalError = error instanceof WalletSDKError && error.originalError ? error.originalError : error;
        console.error(originalError);

        return null;
      }
    }, [accountAddress, polygonSdk]);
    const { data } = useTypedSWR(['polygon-stakes', accountAddress], getStakesData, {
      suspense: true,
      revalidateOnFocus: false,
      refreshInterval: 10000
    });
    const { data: authToken } = useTypedSWR('everstake-wallet-auth-token', getAuthToken, {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    });
    const { data: apr } = useTypedSWR('polygon-apr', () => getStakingAPR('polygon'), {
      revalidateOnFocus: false,
      refreshInterval: 60000
    });

    const handleActionFactory = useCallback(
      (createTx: () => Promise<PolygonTransactionRequest>, errorMessagePrefix: string) => async () => {
        try {
          setActionInProgress(true);
          const { data, from, to, gasLimit } = await createTx();
          const txHash = await sendEvmTransaction(accountAddress, chain!, {
            to,
            from,
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

    const polOrMaticActionsFactory = useCallback(
      (fn: (isPOL: boolean) => Promise<PolygonTransactionRequest>, errorTitle: SyncFn<string, string>) => {
        const internalFactory = (isPOL: boolean) =>
          handleActionFactory(() => fn(isPOL), errorTitle(isPOL ? 'POL' : 'MATIC'));

        return {
          pol: internalFactory(true),
          matic: internalFactory(false)
        };
      },
      [handleActionFactory]
    );

    const { pol: handleApprovePolClick, matic: handleApproveMaticClick } = useMemo(
      () =>
        polOrMaticActionsFactory(
          isPOL => polygonSdk.approve(accountAddress, amountBn.toFixed(), isPOL),
          asset => `Error while approving ${asset}:`
        ),
      [amountBn, accountAddress, polygonSdk, polOrMaticActionsFactory]
    );

    const { pol: handleDelegatePolClick, matic: handleDelegateMaticClick } = useMemo(
      () =>
        polOrMaticActionsFactory(
          isPOL => polygonSdk.delegate(authToken, accountAddress, amountBn.toFixed(), isPOL),
          asset => `Error while delegating ${asset}:`
        ),
      [authToken, accountAddress, amountBn, polygonSdk, polOrMaticActionsFactory]
    );

    const { pol: handleClaimUndelegatePolClick, matic: handleClaimUndelegateMaticClick } = useMemo(
      () =>
        polOrMaticActionsFactory(
          isPOL => polygonSdk.claimUndelegate(accountAddress, undefined, isPOL),
          asset => `Error while claiming undelegated ${asset}:`
        ),
      [polOrMaticActionsFactory, polygonSdk, accountAddress]
    );

    const { pol: handleClaimRewardsPolClick, matic: handleClaimRewardsMaticClick } = useMemo(
      () =>
        polOrMaticActionsFactory(
          isPOL => polygonSdk.reward(accountAddress, isPOL),
          asset => `Error while claiming rewards in ${asset}:`
        ),
      [polOrMaticActionsFactory, polygonSdk, accountAddress]
    );

    const { pol: handleRestakeRewardsPolClick, matic: handleRestakeRewardsMaticClick } = useMemo(
      () =>
        polOrMaticActionsFactory(
          isPOL => polygonSdk.restake(accountAddress, isPOL),
          asset => `Error while restaking rewards in ${asset}:`
        ),
      [polOrMaticActionsFactory, polygonSdk, accountAddress]
    );

    const { pol: handleUndelegatePolClick, matic: handleUndelegateMaticClick } = useMemo(
      () =>
        polOrMaticActionsFactory(
          isPOL => polygonSdk.undelegate(authToken, accountAddress, amountBn.toFixed(), isPOL),
          asset => `Error while undelegating ${asset}:`
        ),
      [polOrMaticActionsFactory, polygonSdk, authToken, accountAddress, amountBn]
    );

    const handleAmountChange = useCallback((value?: string) => {
      setAmount(value ?? '');
    }, []);

    if (!data) {
      return <p>No data available</p>;
    }

    const { reward, maticAllowance, polAllowance, totalDelegated, unbond, currentEpoch } = data;
    const canClaimUndelegation =
      unbond.amount.gt(0) && currentEpoch >= unbond.withdrawEpoch + POLYGON_WITHDRAW_EPOCH_DELAY;

    return (
      <div className="text-font-description flex flex-col gap-1">
        <p className="text-font-regular-bold">POL/MATIC Staking (Delegation)</p>
        <p>Reward: {reward.toFixed()} POL</p>
        <p>MATIC Allowance: {maticAllowance.toFixed()} MATIC</p>
        <p>POL Allowance: {polAllowance.toFixed()} POL</p>
        <p>Total Delegated: {totalDelegated.toFixed()} POL</p>
        <p>
          Unbonding: {unbond.amount.toFixed()} POL (withdraw epoch: {unbond.withdrawEpoch.toString()}, last nonce:
          {unbond.unbondNonces})
        </p>
        <p>Current Epoch: {currentEpoch.toString()}</p>
        <p>Stake activation time after deposit: ~{formatDuration(3600)}</p>
        <p>Withdrawal time after unstake: 2-3 days</p>
        {apr && <p>APR: {apr}%</p>}

        <AssetField
          extraFloatingInner="POL/MATIC"
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
          onClick={handleApproveMaticClick}
          disabled={
            actionInProgress ||
            !isValidAmount ||
            (maticAllowance.isZero() ? amountBn.lt(minPolAmount) : !amountBn.isZero())
          }
        >
          Approve {amount} MATIC
        </StyledButton>

        <StyledButton
          color="primary"
          size="S"
          onClick={handleApprovePolClick}
          disabled={
            actionInProgress ||
            !isValidAmount ||
            (polAllowance.isZero() ? amountBn.lt(minPolAmount) : !amountBn.isZero())
          }
        >
          Approve {amount} POL
        </StyledButton>

        <StyledButton
          color="primary"
          size="S"
          onClick={handleDelegateMaticClick}
          disabled={actionInProgress || !isValidAmount || amountBn.lt(minPolAmount) || amountBn.gt(maticAllowance)}
        >
          Delegate {amount} MATIC
        </StyledButton>

        <StyledButton
          color="primary"
          size="S"
          onClick={handleDelegatePolClick}
          disabled={actionInProgress || !isValidAmount || amountBn.lt(minPolAmount) || amountBn.gt(polAllowance)}
        >
          Delegate {amount} POL
        </StyledButton>

        <StyledButton
          color="primary"
          size="S"
          onClick={handleClaimUndelegateMaticClick}
          disabled={actionInProgress || !canClaimUndelegation}
        >
          Claim Undelegated MATIC
        </StyledButton>

        <StyledButton
          color="primary"
          size="S"
          onClick={handleClaimUndelegatePolClick}
          disabled={actionInProgress || !canClaimUndelegation}
        >
          Claim Undelegated POL
        </StyledButton>

        <StyledButton color="primary" size="S" onClick={handleClaimRewardsMaticClick} disabled={actionInProgress}>
          Claim Rewards MATIC
        </StyledButton>

        <StyledButton color="primary" size="S" onClick={handleClaimRewardsPolClick} disabled={actionInProgress}>
          Claim Rewards POL
        </StyledButton>

        <StyledButton color="primary" size="S" onClick={handleRestakeRewardsMaticClick} disabled={actionInProgress}>
          Restake Rewards MATIC
        </StyledButton>

        <StyledButton color="primary" size="S" onClick={handleRestakeRewardsPolClick} disabled={actionInProgress}>
          Restake Rewards POL
        </StyledButton>

        <StyledButton
          color="red"
          size="S"
          onClick={handleUndelegateMaticClick}
          disabled={actionInProgress || !isValidAmount || amountBn.isZero() || amountBn.gt(totalDelegated)}
        >
          Undelegate {amount} MATIC
        </StyledButton>

        <StyledButton
          color="red"
          size="S"
          onClick={handleUndelegatePolClick}
          disabled={actionInProgress || !isValidAmount || amountBn.isZero() || amountBn.gt(totalDelegated)}
        >
          Undelegate {amount} POL
        </StyledButton>
      </div>
    );
  }
);
