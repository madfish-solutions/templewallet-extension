import React, { memo, useCallback, useMemo, useRef, useState } from 'react';

import { ExchangeClient } from '@nktkas/hyperliquid';
import BigNumber from 'bignumber.js';
import { encodeFunctionData, erc20Abi, getAddress } from 'viem';

import { FormField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import SegmentedControl from 'app/atoms/SegmentedControl';
import { StyledButton } from 'app/atoms/StyledButton';
import { toastError, toastSuccess } from 'app/toaster';
import { toTokenSlug } from 'lib/assets';
import { useEvmAssetBalance } from 'lib/balances/hooks';
import { useTempleClient } from 'lib/temple/front';
import { tokensToAtoms } from 'lib/temple/helpers';
import { COMMON_MAINNET_CHAIN_IDS } from 'lib/temple/types';
import { ZERO } from 'lib/utils/numbers';
import { estimate } from 'temple/evm/estimate';
import { useAccountForEvm } from 'temple/front';
import { useEvmChainByChainId } from 'temple/front/chains';

import { useAccountStates } from './account-states-provider';
import { useClients } from './clients';
import { AccountStates } from './types';

export const DepositOrWithdrawForm = memo(() => {
  const { accountStates } = useAccountStates();
  const evmAccount = useAccountForEvm();
  const {
    clients: { exchange }
  } = useClients();

  if (!evmAccount || !exchange || !accountStates) {
    return null;
  }

  return (
    <DepositOrWithdrawFormContent
      evmAccount={evmAccount.address as HexString}
      accountStates={accountStates}
      exchangeClient={exchange}
    />
  );
});

interface DepositOrWithdrawFormContentProps {
  evmAccount: HexString;
  accountStates: AccountStates;
  exchangeClient: ExchangeClient;
}

type OperationType = 'deposit' | 'withdraw';

const DepositOrWithdrawFormContent = memo<DepositOrWithdrawFormContentProps>(
  ({ evmAccount, accountStates, exchangeClient }) => {
    const { sendEvmTransaction } = useTempleClient();
    const [operationType, setOperationType] = useState<OperationType>('deposit');
    const [amount, setAmount] = useState<string | undefined>('');
    const [actionPending, setActionPending] = useState(false);
    const [destination, setDestination] = useState<string>('');
    const arbitrum = useEvmChainByChainId(COMMON_MAINNET_CHAIN_IDS.arbitrum)!;
    const { value: arbUsdcBalance = ZERO } = useEvmAssetBalance(
      toTokenSlug('0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
      evmAccount,
      arbitrum
    );

    const parsedDestination = useMemo(() => {
      try {
        return getAddress(destination);
      } catch {
        return undefined;
      }
    }, [destination]);

    const parsedAmount = useMemo(() => new BigNumber(amount ?? ''), [amount]);
    const cleanAmount = useCallback(() => setAmount(undefined), [setAmount]);
    const handleDestinationChange = useCallback<
      React.ChangeEventHandler<HTMLInputElement> & React.ChangeEventHandler<HTMLTextAreaElement>
    >(e => setDestination(e.target.value), [setDestination]);
    const handleSubmit = useCallback(async () => {
      if (actionPending) return;

      try {
        setActionPending(true);

        if (operationType === 'deposit') {
          const functionData = encodeFunctionData({
            abi: erc20Abi,
            args: ['0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7', BigInt(tokensToAtoms(parsedAmount, 6).toFixed())],
            functionName: 'transfer'
          });
          const estimation = await estimate(arbitrum, {
            from: evmAccount,
            to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            value: BigInt(0),
            type: 'eip1559',
            data: functionData
          });

          await sendEvmTransaction(evmAccount, arbitrum, {
            from: evmAccount,
            to: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
            value: BigInt(0),
            type: 'eip1559',
            data: functionData,
            gas: estimation.gas,
            maxFeePerGas: estimation.maxFeePerGas,
            maxPriorityFeePerGas: estimation.maxPriorityFeePerGas,
            nonce: estimation.nonce
          });
          toastSuccess('Deposit submitted');
        } else {
          await exchangeClient.withdraw3({
            destination: parsedDestination!,
            amount: parsedAmount.toFixed()
          });
          toastSuccess('Withdrawal submitted');
        }
      } catch (e) {
        console.error(e);
        toastError('Failed to submit operation');
      } finally {
        setActionPending(false);
      }
    }, [
      actionPending,
      arbitrum,
      evmAccount,
      exchangeClient,
      operationType,
      parsedAmount,
      parsedDestination,
      sendEvmTransaction
    ]);
    const { min: minAmount, max: maxAmount } = useMemo(
      () =>
        operationType === 'deposit'
          ? { min: 5, max: arbUsdcBalance.toFixed() }
          : { min: 1.000001, max: accountStates.perpsState.withdrawable },
      [operationType, arbUsdcBalance, accountStates.perpsState.withdrawable]
    );
    const amountIsValid = parsedAmount.gte(minAmount) && parsedAmount.lte(maxAmount);

    const depositSegmentRef = useRef<HTMLDivElement>(null);
    const withdrawSegmentRef = useRef<HTMLDivElement>(null);
    const segments = useMemo(
      () => [
        {
          label: 'Deposit',
          value: 'deposit' as const,
          ref: depositSegmentRef
        },
        {
          label: 'Withdraw',
          value: 'withdraw' as const,
          ref: withdrawSegmentRef
        }
      ],
      []
    );

    return (
      <div className="flex flex-col gap-1">
        <SegmentedControl<OperationType>
          name="deposit-or-withdraw-tab-switch"
          segments={segments}
          activeSegment={operationType}
          setActiveSegment={setOperationType}
        />

        <AssetField
          value={amount}
          onChange={setAmount}
          extraFloatingInner="USDC"
          assetDecimals={6}
          cleanable={Boolean(amount)}
          shouldShowErrorCaption
          onClean={cleanAmount}
          label={`Min: ${minAmount}, Max: ${maxAmount}`}
        />

        {operationType === 'withdraw' && (
          <FormField value={destination} onChange={handleDestinationChange} label="Destination" placeholder="0x..." />
        )}

        <StyledButton
          color={operationType === 'deposit' ? 'secondary' : 'red'}
          disabled={!amountIsValid || (!parsedDestination && operationType === 'withdraw') || actionPending}
          size="L"
          onClick={handleSubmit}
        >
          {operationType === 'deposit' ? 'Deposit' : 'Withdraw'}
        </StyledButton>
      </div>
    );
  }
);
