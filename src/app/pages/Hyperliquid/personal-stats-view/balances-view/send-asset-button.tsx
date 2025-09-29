import React, { memo, useCallback } from 'react';

import { ExchangeClient } from '@nktkas/hyperliquid';
import BigNumber from 'bignumber.js';
import { Controller, useForm } from 'react-hook-form-v7';
import { isAddress } from 'viem';

import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import AssetField from 'app/atoms/AssetField';
import { FormField } from 'app/atoms/FormField';
import { TextButton } from 'app/atoms/TextButton';
import { toastError, toastSuccess } from 'app/toaster';
import { useBooleanState } from 'lib/ui/hooks';

import { useClients } from '../../clients';

interface SendAssetButtonProps {
  minValue: string;
  maxValue: string;
  coin: string;
  decimals: number;
  send: (destination: HexString, amount: string, exchangeClient: ExchangeClient) => Promise<void>;
}

export const SendAssetButton = memo<SendAssetButtonProps>(props => {
  const [modalOpened, openModal, closeModal] = useBooleanState(false);

  const {
    clients: { exchange }
  } = useClients();

  if (!exchange) return null;

  return (
    <>
      <TextButton color="blue" onClick={openModal}>
        Send
      </TextButton>

      {modalOpened && <SendAssetModal {...props} onClose={closeModal} exchangeClient={exchange} />}
    </>
  );
});

const SendAssetModal = memo<SendAssetButtonProps & { onClose: EmptyFn; exchangeClient: ExchangeClient }>(
  ({ minValue, maxValue, coin, decimals, send, onClose, exchangeClient }) => {
    const { control, handleSubmit, setValue, formState } = useForm<{ amount: string; destination: string }>({
      defaultValues: { amount: '', destination: '' }
    });

    const validateAmount = useCallback((amount: string) => {
      if (!amount) return 'Required';

      const parsedAmount = new BigNumber(amount);

      if (!parsedAmount.isPositive()) return 'Amount must be positive';

      return true;
    }, []);

    const validateDestination = useCallback((destination: string) => {
      if (!destination) return 'Required';

      if (!isAddress(destination)) return 'Invalid address';

      return true;
    }, []);

    const onSubmit = useCallback(
      async ({ amount, destination }: { amount: string; destination: string }) => {
        if (formState.isSubmitting) return;

        try {
          await send(destination as HexString, amount, exchangeClient);
          toastSuccess(`Transferred ${amount} ${coin} to ${destination}`);
          onClose();
        } catch (error) {
          console.error(error);
          toastError(`Failed to transfer ${amount} ${coin} to ${destination}`);
        }
      },
      [formState.isSubmitting, send, exchangeClient, coin, onClose]
    );

    const cleanAmount = useCallback(() => setValue('amount', '', { shouldValidate: true }), [setValue]);

    return (
      <ActionModal title={`Send ${coin}`} onClose={onClose}>
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
                  extraFloatingInner={coin}
                  assetDecimals={decimals}
                  cleanable={Boolean(value)}
                  shouldShowErrorCaption
                  onClean={cleanAmount}
                  label={`Min: ${minValue}, Max: ${maxValue}`}
                  errorCaption={formState.submitCount > 0 ? formState.errors.amount?.message : null}
                />
              )}
            />
            <Controller
              name="destination"
              control={control}
              rules={{ validate: validateDestination }}
              render={({ field: { value, onChange, onBlur }, formState }) => (
                <FormField
                  value={value}
                  onBlur={onBlur}
                  onChange={v => onChange(v ?? '')}
                  label="Destination"
                  errorCaption={formState.submitCount > 0 ? formState.errors.destination?.message : null}
                  placeholder="0x..."
                />
              )}
            />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton color="primary" disabled={formState.isSubmitting} type="submit">
              Send
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      </ActionModal>
    );
  }
);
