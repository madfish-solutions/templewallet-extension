import React, { FC, FocusEventHandler, useCallback, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import { Controller, SubmitHandler, Validate, UseFormReturn } from 'react-hook-form-v7';
import { useDebounce } from 'use-debounce';

import { Button, NoSpaceField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import { Loader } from 'app/atoms/loader';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { SelectAccountModal } from 'app/pages/Send/modals/SelectAccount';
import { useFiatCurrency } from 'lib/fiat-currency';
import { t, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { readClipboard } from 'lib/ui/utils';
import { ZERO } from 'lib/utils/numbers';
import { OneOfChains } from 'temple/front';
import { TempleChainKind } from 'temple/types';

import { SendFormData } from './interfaces';
import { SELECT_ACCOUNT_BUTTON_ID, SelectAccountButton } from './SelectAccountButton';
import { SelectAssetButton } from './SelectAssetButton';
import { SendFormSelectors } from './selectors';
import { useAddressFieldAnalytics } from './use-address-field-analytics';

interface Props {
  assetSlug: string;
  assetSymbol: string;
  assetPrice: BigNumber;
  assetDecimals: number;
  network: OneOfChains;
  accountPkh: string | HexString;
  form: UseFormReturn<SendFormData>;
  validateAmount: Validate<string, SendFormData>;
  validateRecipient: Validate<string, SendFormData>;
  onSelectAssetClick: EmptyFn;
  shouldUseFiat: boolean;
  canToggleFiat: boolean;
  setShouldUseFiat: (value: boolean) => void;
  onSubmit: SubmitHandler<SendFormData>;
  maxEstimating: boolean;
  maxAmount: BigNumber;
  isToFilledWithFamiliarAddress: boolean;
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
  maxEstimating,
  validateAmount,
  validateRecipient,
  onSelectAssetClick,
  shouldUseFiat,
  canToggleFiat,
  setShouldUseFiat,
  onSubmit,
  isToFilledWithFamiliarAddress,
  evm
}) => {
  const [selectAccountModalOpened, setSelectAccountModalOpen, setSelectAccountModalClosed] = useBooleanState(false);

  const { watch, handleSubmit, control, setValue, getValues, formState } = form;
  const { isValid, isSubmitting, submitCount, errors } = formState;

  const formSubmitted = submitCount > 0;

  const toValue = watch('to');
  const [toValueDebounced] = useDebounce(toValue, 300);
  const amountValue = watch('amount');

  useAddressFieldAnalytics(toValue, 'RECIPIENT_NETWORK');

  const { selectedFiatCurrency } = useFiatCurrency();

  const amountFieldRef = useRef<HTMLInputElement>(null);
  const toFieldRef = useRef<HTMLTextAreaElement>(null);

  const [toFieldFocused, setToFieldFocused] = useState(false);

  const floatingAssetSymbol = useMemo(
    () => (shouldUseFiat ? selectedFiatCurrency.name : assetSymbol.slice(0, 4)),
    [assetSymbol, selectedFiatCurrency.name, shouldUseFiat]
  );

  const handleSetMaxAmount = useCallback(() => {
    if (maxAmount) setValue('amount', maxAmount.toString(), { shouldValidate: formSubmitted });
  }, [setValue, maxAmount, formSubmitted]);

  const handleToFieldFocus = useCallback(() => {
    toFieldRef.current?.focus();
    setToFieldFocused(true);
  }, [setToFieldFocused]);

  const handleAmountClean = useCallback(
    () => setValue('amount', '', { shouldValidate: formSubmitted }),
    [setValue, formSubmitted]
  );

  const handleToClean = useCallback(
    () => setValue('to', '', { shouldValidate: formSubmitted }),
    [setValue, formSubmitted]
  );

  const handleAmountFieldFocus = useCallback<FocusEventHandler>(evt => {
    evt.preventDefault();
    amountFieldRef.current?.focus({ preventScroll: true });
  }, []);

  const handlePasteButtonClick = useCallback(() => {
    readClipboard()
      .then(value => setValue('to', value, { shouldValidate: formSubmitted }))
      .catch(console.error);
  }, [formSubmitted, setValue]);

  const handleToFieldBlur = useCallback<FocusEventHandler>(e => {
    if (e.relatedTarget?.id === SELECT_ACCOUNT_BUTTON_ID) return;

    setToFieldFocused(false);
  }, []);

  const handleSelectRecipientButtonClick = useCallback(() => {
    setToFieldFocused(false);
    setSelectAccountModalOpen();
  }, [setSelectAccountModalOpen]);

  const toAssetAmount = useCallback(
    (fiatAmount: BigNumber.Value = ZERO) =>
      new BigNumber(fiatAmount || '0').dividedBy(assetPrice ?? 1).toFormat(assetDecimals ?? 0, BigNumber.ROUND_FLOOR, {
        decimalSeparator: '.'
      }),
    [assetPrice, assetDecimals]
  );

  const handleFiatToggle = useCallback(
    (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      evt.preventDefault();

      const newShouldUseFiat = !shouldUseFiat;
      setShouldUseFiat(newShouldUseFiat);

      const amount = getValues().amount;

      if (!amount) return;

      const amountBN = new BigNumber(amount);

      setValue(
        'amount',
        (newShouldUseFiat ? amountBN.multipliedBy(assetPrice) : amountBN.div(assetPrice)).toFormat(
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
      setValue('to', address, { shouldValidate: formSubmitted });
      setSelectAccountModalClosed();
    },
    [setSelectAccountModalClosed, setValue, formSubmitted]
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
            render={({ field: { onChange, value } }) => (
              <AssetField
                ref={amountFieldRef}
                value={value}
                onFocus={handleAmountFieldFocus}
                onChange={onChange}
                extraFloatingInner={floatingAssetSymbol}
                assetDecimals={shouldUseFiat ? 2 : assetDecimals ?? 0}
                cleanable={Boolean(amountValue)}
                rightSideComponent={
                  <Button
                    type="button"
                    onClick={handleSetMaxAmount}
                    disabled={maxEstimating}
                    className="flex justify-center items-center text-font-description-bold text-white bg-primary hover:bg-primary-hover rounded-md py-1"
                    style={{ width: '41px' }}
                  >
                    {maxEstimating ? <Loader size="S" trackVariant="light" /> : <T id="max" />}
                  </Button>
                }
                underneathComponent={
                  <div className="flex justify-between mt-1">
                    <div className="max-w-40">
                      <ConvertedInputAssetAmount
                        chainId={network.chainId}
                        assetSlug={assetSlug}
                        assetSymbol={assetSymbol}
                        amountValue={shouldUseFiat ? toAssetAmount(amountValue) : amountValue || '0'}
                        toFiat={!shouldUseFiat}
                        evm={network.kind === TempleChainKind.EVM}
                      />
                    </div>
                    {canToggleFiat && (
                      <Button
                        className="text-font-description-bold text-secondary px-1 py-0.5 max-w-40 truncate"
                        onClick={handleFiatToggle}
                      >
                        Switch to {shouldUseFiat ? assetSymbol : selectedFiatCurrency.name}
                      </Button>
                    )}
                  </div>
                }
                onClean={handleAmountClean}
                label={t('amount')}
                placeholder={`0.00 ${floatingAssetSymbol}`}
                errorCaption={formSubmitted ? errors.amount?.message : null}
                containerClassName="mb-8"
                testID={SendFormSelectors.amountInput}
              />
            )}
          />

          <Controller
            name="to"
            control={control}
            rules={{ validate: validateRecipient }}
            render={({ field: { onChange, value } }) => (
              <NoSpaceField
                ref={toFieldRef}
                value={value}
                onChange={onChange}
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
                errorCaption={!toFieldFocused && formSubmitted ? errors.to?.message : null}
                style={{ resize: 'none' }}
                containerClassName="mb-4"
                testID={SendFormSelectors.recipientInput}
              />
            )}
          />

          {(toFieldFocused || isToFilledWithFamiliarAddress) && (
            <SelectAccountButton
              value={toValueDebounced}
              onClick={handleSelectRecipientButtonClick}
              testID={SendFormSelectors.selectAccountButton}
            />
          )}
        </form>
      </div>

      <ActionsButtonsBox flexDirection="col" style={{ backgroundColor: '#FBFBFB' }}>
        <StyledButton
          type="submit"
          form="send-form"
          size="L"
          color="primary"
          disabled={(formSubmitted && !isValid) || isSubmitting}
          testID={SendFormSelectors.sendButton}
        >
          Review
        </StyledButton>
      </ActionsButtonsBox>

      <SelectAccountModal
        selectedAccountAddress={toValueDebounced}
        onAccountSelect={handleRecipientAddressSelect}
        opened={selectAccountModalOpened}
        onRequestClose={setSelectAccountModalClosed}
        evm={evm}
      />
    </>
  );
};
