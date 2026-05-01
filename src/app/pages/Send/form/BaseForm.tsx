import React, { FC, FocusEventHandler, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import { isEmpty } from 'lodash';
import { Controller, SubmitErrorHandler, SubmitHandler, useFormContext, useWatch, Validate } from 'react-hook-form';
import { useDebounce } from 'use-debounce';

import { Button, NoSpaceField } from 'app/atoms';
import AssetField from 'app/atoms/AssetField';
import { ConvertedInputAssetAmount } from 'app/atoms/ConvertedInputAssetAmount';
import { Loader } from 'app/atoms/Loader';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { SelectAccountModal } from 'app/pages/Send/modals/SelectAccount';
import { dispatch } from 'app/store';
import { setOnRampAssetAction } from 'app/store/settings/actions';
import { isWertSupportedChainAssetSlug } from 'lib/apis/wert';
import { toChainAssetSlug } from 'lib/assets/utils';
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
  isCollectible: boolean;
  network: OneOfChains;
  accountPkh: string | HexString;
  validateAmount: Validate<string, SendFormData>;
  validateRecipient: Validate<string, SendFormData>;
  onSelectAssetClick: EmptyFn;
  shouldUseFiat: boolean;
  canToggleFiat: boolean;
  setShouldUseFiat: SyncFn<boolean>;
  onSubmit: SubmitHandler<SendFormData>;
  maxEstimating: boolean;
  maxAmount: BigNumber;
  isToFilledWithFamiliarAddress: boolean;
  shouldShowConvertedAmountBlock?: boolean;
  evm?: boolean;
}

export const BaseForm: FC<Props> = ({
  network,
  accountPkh,
  assetSlug,
  assetSymbol,
  assetPrice,
  assetDecimals,
  isCollectible,
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
  shouldShowConvertedAmountBlock = true,
  evm
}) => {
  const [selectAccountModalOpened, setSelectAccountModalOpen, setSelectAccountModalClosed] = useBooleanState(false);

  const { handleSubmit, control, setValue, getValues, formState } = useFormContext<SendFormData>();
  const { isSubmitting, submitCount, errors } = formState;

  const formSubmitted = submitCount > 0;

  const toValue = useWatch({ control, name: 'to' });
  const [toValueDebounced] = useDebounce(toValue, 300);
  const amountValue = useWatch({ control, name: 'amount' });

  useAddressFieldAnalytics(toValue, 'RECIPIENT_NETWORK');

  const { selectedFiatCurrency } = useFiatCurrency();

  const toFieldRef = useRef<HTMLTextAreaElement>(null);

  const [toFieldFocused, setToFieldFocused] = useState(false);

  const floatingAssetSymbol = shouldUseFiat ? selectedFiatCurrency.name : assetSymbol.slice(0, 4);

  const handleSetMaxAmount = () => {
    if (maxAmount) setValue('amount', maxAmount.toString(), { shouldValidate: formSubmitted });
  };

  const handleToFieldFocus = () => {
    toFieldRef.current?.focus();
    setToFieldFocused(true);
  };

  const handleAmountClean = () => setValue('amount', '', { shouldValidate: formSubmitted });

  const handleToClean = () => setValue('to', '', { shouldValidate: formSubmitted });

  const handlePasteButtonClick = () => {
    readClipboard()
      .then(value => setValue('to', value, { shouldValidate: formSubmitted }))
      .catch(console.error);
  };

  const handleToFieldBlur: FocusEventHandler = e => {
    if (e.relatedTarget?.id === SELECT_ACCOUNT_BUTTON_ID) return;

    setToFieldFocused(false);
  };

  const handleSelectRecipientButtonClick = () => {
    setToFieldFocused(false);
    setSelectAccountModalOpen();
  };

  const toAssetAmount = (fiatAmount: BigNumber.Value = ZERO) =>
    new BigNumber(fiatAmount || '0').dividedBy(assetPrice ?? 1).toFormat(assetDecimals, BigNumber.ROUND_FLOOR, {
      decimalSeparator: '.'
    });

  const handleFiatToggle = (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    evt.preventDefault();

    const newShouldUseFiat = !shouldUseFiat;
    setShouldUseFiat(newShouldUseFiat);

    const amount = getValues().amount;

    if (!amount) return;

    const amountBN = new BigNumber(amount);

    setValue(
      'amount',
      (newShouldUseFiat ? amountBN.multipliedBy(assetPrice) : amountBN.div(assetPrice)).toFormat(
        newShouldUseFiat ? 2 : assetDecimals,
        BigNumber.ROUND_FLOOR,
        {
          decimalSeparator: '.'
        }
      )
    );
  };

  const handleRecipientAddressSelect = (address: string) => {
    setValue('to', address, { shouldValidate: formSubmitted });
    setSelectAccountModalClosed();
  };

  const onInvalidSubmit: SubmitErrorHandler<SendFormData> = errors => {
    if (errors.amount?.message?.includes(t('maximalAmount'))) {
      const chainAssetSlug = toChainAssetSlug(network.kind, network.chainId, assetSlug);

      isWertSupportedChainAssetSlug(chainAssetSlug) && dispatch(setOnRampAssetAction({ chainAssetSlug }));
    }
  };

  return (
    <>
      <div className="flex-1 px-4 flex flex-col overflow-y-auto">
        <div className="text-font-description-bold py-1 mb-1">
          <T id="token" />
        </div>

        <SelectAssetButton
          assetSlug={assetSlug}
          network={network}
          accountPkh={accountPkh}
          onClick={onSelectAssetClick}
          className="mb-4"
          testID={SendFormSelectors.selectAssetButton}
        />

        <form id="send-form" onSubmit={handleSubmit(onSubmit, onInvalidSubmit)}>
          <Controller
            name="amount"
            control={control}
            rules={{ validate: validateAmount }}
            render={({ field: { value, onChange, onBlur }, formState }) => (
              <AssetField
                value={value}
                onBlur={onBlur}
                onChange={v => onChange(v ?? '')}
                extraFloatingInner={isCollectible ? undefined : floatingAssetSymbol}
                assetDecimals={shouldUseFiat ? 2 : assetDecimals}
                cleanable={Boolean(amountValue)}
                shouldShowErrorCaption={!shouldShowConvertedAmountBlock}
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
                  shouldShowConvertedAmountBlock ? (
                    <div className="flex justify-between items-center mt-1 gap-2">
                      {formState.errors.amount ? (
                        <span className="flex-1 text-font-description text-error">
                          {formState.errors.amount.message}
                        </span>
                      ) : (
                        <ConvertedInputAssetAmount
                          chainId={network.chainId}
                          assetSlug={assetSlug}
                          assetSymbol={assetSymbol}
                          amountValue={shouldUseFiat ? toAssetAmount(amountValue) : amountValue || '0'}
                          toFiat={!shouldUseFiat}
                          evm={network.kind === TempleChainKind.EVM}
                        />
                      )}
                      {canToggleFiat && (
                        <Button
                          className="text-font-description-bold text-secondary px-1 py-0.5 max-w-40 truncate"
                          onClick={handleFiatToggle}
                        >
                          Switch to {shouldUseFiat ? assetSymbol : selectedFiatCurrency.name}
                        </Button>
                      )}
                    </div>
                  ) : undefined
                }
                onClean={handleAmountClean}
                label={t('amount')}
                placeholder={isCollectible ? '0.00' : `0.00 ${floatingAssetSymbol}`}
                errorCaption={formSubmitted ? errors.amount?.message : null}
                containerClassName={isCollectible ? 'pb-3' : 'pb-8'}
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
                testID={SendFormSelectors.recipientInput}
              />
            )}
          />

          {(toFieldFocused || isToFilledWithFamiliarAddress) && (
            <div className="mb-4">
              <SelectAccountButton
                value={toValueDebounced}
                onClick={handleSelectRecipientButtonClick}
                testID={SendFormSelectors.selectAccountButton}
              />
            </div>
          )}
        </form>
      </div>

      <ActionsButtonsBox bgSet={false}>
        <StyledButton
          type="submit"
          form="send-form"
          size="L"
          color="primary"
          loading={maxEstimating || isSubmitting}
          disabled={formSubmitted && !isEmpty(errors)}
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
