import React, { FC, FocusEventHandler, useCallback, useRef, useState } from 'react';

import { ChainIds } from '@taquito/taquito';
import BigNumber from 'bignumber.js';
import { isString } from 'lodash';
import { Controller, OnSubmit, Validate } from 'react-hook-form';
import { FormContextValues } from 'react-hook-form/dist/contextTypes';

import { Button, NoSpaceField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import { StyledButton } from 'app/atoms/StyledButton';
import { useFiatCurrency } from 'lib/fiat-currency';
import { t, T } from 'lib/i18n';
import { useBooleanState, useSafeState } from 'lib/ui/hooks';
import { readClipboard } from 'lib/ui/utils';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SelectAccountModal } from '../modals/SelectAccount';

import { SendFormData } from './interfaces';
import { SelectAccountButton } from './SelectAccountButton';
import { SelectAssetButton } from './SelectAssetButton';
import { SendFormSelectors } from './selectors';

interface Props {
  assetSlug: string;
  assetSymbol: string;
  assetPrice: BigNumber;
  assetDecimals: number;
  network: OneOfChains;
  accountPkh: string | HexString;
  form: FormContextValues<SendFormData>;
  validateAmount: Validate;
  validateRecipient: Validate;
  onSelectAssetClick: EmptyFn;
  onSubmit: OnSubmit<SendFormData>;
  maxAmount: BigNumber;
  evm?: boolean;
}

export const BaseForm: FC<Props> = ({
  form,
  network,
  accountPkh,
  assetSlug,
  assetSymbol,
  assetPrice,
  assetDecimals,
  maxAmount,
  validateAmount,
  validateRecipient,
  onSelectAssetClick,
  onSubmit,
  evm
}) => {
  const [selectedRecipientAddress, setSelectedRecipientAddress] = useState('');
  const [selectAccountModalOpened, setSelectAccountModalOpen, setSelectAccountModalClosed] = useBooleanState(false);

  const { watch, handleSubmit, errors, control, setValue, triggerValidation, getValues } = form;

  const toValue = watch('to');
  const amountValue = watch('amount');

  //const { onBlur } = useAddressFieldAnalytics(network, toValue, 'RECIPIENT_NETWORK');
  const { selectedFiatCurrency } = useFiatCurrency();

  const amountFieldRef = useRef<HTMLInputElement>(null);
  const toFieldRef = useRef<HTMLTextAreaElement>(null);

  const [shouldUseFiat, setShouldUseFiat] = useSafeState(false);

  const canToggleFiat = network.chainId === ChainIds.MAINNET;

  const [toFieldFocused, setToFieldFocused] = useState(false);

  const handleSetMaxAmount = useCallback(() => {
    if (maxAmount) {
      setValue('amount', maxAmount.toString());
      triggerValidation('amount');
    }
  }, [setValue, maxAmount, triggerValidation]);

  const handleToFieldFocus = useCallback(() => {
    toFieldRef.current?.focus();
    setToFieldFocused(true);
  }, [setToFieldFocused]);

  const handleToClean = useCallback(() => {
    setValue('to', '');
    triggerValidation('to');
  }, [setValue, triggerValidation]);

  const handleAmountClean = useCallback(() => {
    setValue('amount', undefined);
    triggerValidation('amount');
  }, [setValue, triggerValidation]);

  const handleAmountFieldFocus = useCallback<FocusEventHandler>(evt => {
    evt.preventDefault();
    amountFieldRef.current?.focus({ preventScroll: true });
  }, []);

  const handlePasteButtonClick = useCallback(() => {
    readClipboard()
      .then(value => setValue('to', value))
      .catch(console.error);
  }, [setValue]);

  const handleToFieldBlur = useCallback(() => {
    setToFieldFocused(false);
    //onBlur();
  }, [setToFieldFocused]);

  const toAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value) =>
      new BigNumber(fiatAmount).dividedBy(assetPrice ?? 1).toFormat(assetDecimals ?? 0, BigNumber.ROUND_FLOOR, {
        decimalSeparator: '.'
      }),
    [assetPrice, assetDecimals]
  );

  const handleFiatToggle = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      evt.preventDefault();

      const newShouldUseFiat = !shouldUseFiat;
      setShouldUseFiat(newShouldUseFiat);
      if (!getValues().amount) {
        return;
      }
      const amount = new BigNumber(getValues().amount);
      setValue(
        'amount',
        (newShouldUseFiat ? amount.multipliedBy(assetPrice) : amount.div(assetPrice)).toFormat(
          newShouldUseFiat ? 2 : 6,
          BigNumber.ROUND_FLOOR,
          {
            decimalSeparator: '.'
          }
        )
      );
    },
    [setShouldUseFiat, shouldUseFiat, getValues, assetPrice, setValue]
  );

  const handleRecipientAddressSelect = useCallback(
    (address: string) => {
      setSelectedRecipientAddress(address);
      setSelectAccountModalClosed();
    },
    [setSelectAccountModalClosed]
  );

  return (
    <>
      <div className="flex-1 pt-4 px-4 flex flex-col overflow-y-auto">
        <div className="text-font-description-bold mb-2">
          <T id="token" />
        </div>

        <SelectAssetButton
          selectedAssetSlug={assetSlug}
          network={network}
          accountPkh={accountPkh}
          onClick={onSelectAssetClick}
          className="mb-4"
          testID={SendFormSelectors.selectAssetButton}
        />

        <form id="send-form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="amount"
            control={control}
            rules={{ validate: validateAmount }}
            onChange={([v]) => v}
            as={
              <AssetField
                ref={amountFieldRef}
                onFocus={handleAmountFieldFocus}
                assetDecimals={shouldUseFiat ? 2 : assetDecimals ?? 0}
                cleanable={isString(amountValue)}
                rightSideComponent={
                  <Button
                    type="button"
                    onClick={handleSetMaxAmount}
                    className="text-font-description-bold text-white bg-primary rounded-md px-2 py-1"
                  >
                    <T id="max" />
                  </Button>
                }
                underneathComponent={
                  <div className="flex justify-between mt-1">
                    <span>
                      {amountValue ? (
                        <ConvertedInputAssetAmount
                          chainId={network.chainId}
                          assetSlug={assetSlug}
                          assetSymbol={assetSymbol}
                          amountValue={shouldUseFiat ? toAssetAmount(amountValue) : amountValue}
                          toFiat={!shouldUseFiat}
                          evm={network.kind === TempleChainKind.EVM}
                        />
                      ) : null}
                    </span>
                    {canToggleFiat && (
                      <Button
                        className="text-font-description-bold text-secondary px-1 py-0.5"
                        onClick={handleFiatToggle}
                      >
                        Switch to {shouldUseFiat ? assetSymbol : selectedFiatCurrency.name}
                      </Button>
                    )}
                  </div>
                }
                onClean={handleAmountClean}
                label={t('amount')}
                placeholder="0.00"
                errorCaption={errors.amount?.message}
                containerClassName="mb-8"
                testID={SendFormSelectors.amountInput}
              />
            }
          />

          <Controller
            name="to"
            control={control}
            rules={{ validate: validateRecipient }}
            onChange={([v]) => v}
            as={
              <NoSpaceField
                ref={toFieldRef}
                onFocus={handleToFieldFocus}
                extraRightInnerWrapper="unset"
                onBlur={handleToFieldBlur}
                textarea
                showPasteButton
                rows={3}
                cleanable={Boolean(toValue)}
                onClean={handleToClean}
                onPasteButtonClick={handlePasteButtonClick}
                id="send-to"
                label={t('recipient')}
                placeholder="Address or Domain name"
                errorCaption={!toFieldFocused ? errors.to?.message : null}
                style={{ resize: 'none' }}
                containerClassName="mb-4"
                testID={SendFormSelectors.recipientInput}
              />
            }
          />

          <SelectAccountButton value={selectedRecipientAddress} onClick={setSelectAccountModalOpen} />
        </form>
      </div>

      <div className="flex flex-col pt-4 px-4 pb-6">
        <StyledButton type="submit" form="send-form" size="L" color="primary" testID={SendFormSelectors.sendButton}>
          Review
        </StyledButton>
      </div>

      <SelectAccountModal
        selectedAccountAddress={selectedRecipientAddress}
        onAccountSelect={handleRecipientAddressSelect}
        opened={selectAccountModalOpened}
        onRequestClose={setSelectAccountModalClosed}
        evm={evm}
      />
    </>
  );
};
