import React, { memo, useCallback } from 'react';

import { ExchangeClient } from '@nktkas/hyperliquid';
import BigNumber from 'bignumber.js';
import { Controller, useForm } from 'react-hook-form-v7';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import AssetField from 'app/atoms/AssetField';
import { TextButton } from 'app/atoms/TextButton';
import { toastError, toastSuccess } from 'app/toaster';
import { useBooleanState } from 'lib/ui/hooks';

import { useClients } from '../../clients';

interface TransferUsdcButtonProps {
  minValue: string;
  maxValue: string;
  toPerp: boolean;
}

export const TransferUsdcButton = memo<TransferUsdcButtonProps>(({ toPerp, ...restProps }) => {
  const [modalOpened, openModal, closeModal] = useBooleanState(false);

  const {
    clients: { exchange }
  } = useClients();

  if (!exchange) return null;

  return (
    <>
      <TextButton color="blue" onClick={openModal}>
        Transfer to {toPerp ? 'Perps' : 'Spot'}
      </TextButton>

      {modalOpened && (
        <TransferUsdcModal toPerp={toPerp} onClose={closeModal} exchangeClient={exchange} {...restProps} />
      )}
    </>
  );
});

const TransferUsdcModal = memo<TransferUsdcButtonProps & { onClose: EmptyFn; exchangeClient: ExchangeClient }>(
  ({ minValue, maxValue, toPerp, onClose, exchangeClient }) => {
    const { control, handleSubmit, setValue, formState } = useForm<{ amount: string }>({
      defaultValues: { amount: '' }
    });

    const validateAmount = useCallback((amount: string) => {
      if (!amount) return 'Required';

      const parsedAmount = new BigNumber(amount);

      if (!parsedAmount.isPositive()) return 'Amount must be positive';

      return true;
    }, []);

    const cleanAmount = useCallback(() => setValue('amount', '', { shouldValidate: true }), [setValue]);

    const onSubmit = useCallback(
      async ({ amount }: { amount: string }) => {
        if (formState.isSubmitting) return;

        try {
          await exchangeClient.usdClassTransfer({ toPerp, amount });
          toastSuccess(`Transferred ${amount} USDC to ${toPerp ? 'Perps' : 'Spot'}`);
          onClose();
        } catch (error) {
          console.error(error);
          toastError(`Failed to transfer ${amount} USDC to ${toPerp ? 'Perps' : 'Spot'}`);
        }
      },
      [exchangeClient, formState.isSubmitting, toPerp, onClose]
    );

    return (
      <ActionModal title={`Transfer to ${toPerp ? 'Perps' : 'Spot'}`} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ActionModalBodyContainer>
            <Controller
              name="amount"
              control={control}
              rules={{ validate: validateAmount }}
              render={({ field: { value, onChange, onBlur }, formState }) => (
                <AssetField
                  value={value}
                  onBlur={onBlur}
                  onChange={v => onChange(v ?? '')}
                  extraFloatingInner="USDC"
                  assetDecimals={8}
                  cleanable={Boolean(value)}
                  shouldShowErrorCaption
                  onClean={cleanAmount}
                  label={`Min: ${minValue}, Max: ${maxValue}`}
                  errorCaption={formState.submitCount > 0 ? formState.errors.amount?.message : null}
                />
              )}
            />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton color="primary" disabled={formState.isSubmitting} type="submit">
              Transfer
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      </ActionModal>
    );
  }
);
