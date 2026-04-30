import React, { memo, useCallback, useState } from 'react';

import { Controller, useFormContext, useFormState } from 'react-hook-form';
import { useDebounce } from 'use-debounce';

import { NoSpaceField } from 'app/atoms';
import { SelectAccountButton, SELECT_ACCOUNT_BUTTON_ID } from 'app/pages/Send/form/SelectAccountButton';
import { SelectAccountModal } from 'app/pages/Send/modals/SelectAccount';
import { CrossChainAsset, CrossChainDest, validateCrossChainRecipient } from 'lib/cross-chain';
import { t } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { readClipboard } from 'lib/ui/utils';

import { CrossChainFormData } from '../form-data';

interface Props {
  toAsset: CrossChainAsset;
}

const DEST_LABEL: Record<CrossChainDest, string> = {
  btc: 'Bitcoin',
  evm: 'EVM',
  tezos: 'Tezos'
};

export const RecipientField = memo<Props>(({ toAsset }) => {
  const { control, setValue, watch } = useFormContext<CrossChainFormData>();
  const { errors, submitCount } = useFormState<CrossChainFormData>({ control, name: 'to' });

  const toValue = watch('to');
  const [toValueDebounced] = useDebounce(toValue, 300);
  const formSubmitted = submitCount > 0;
  const hasRecipientError = formSubmitted && Boolean(errors.to);
  const hideSelectAccount = hasRecipientError && Boolean(toValue);

  const [focused, setFocused] = useState(false);
  const [selectModalOpened, openSelectModal, closeSelectModal] = useBooleanState(false);

  const validate = useCallback(
    (value: string) => {
      const result = validateCrossChainRecipient(value, toAsset);
      return result === true ? true : t(result);
    },
    [toAsset]
  );

  const handlePasteClick = useCallback(() => {
    readClipboard().then(value => setValue('to', value, { shouldValidate: formSubmitted }));
  }, [formSubmitted, setValue]);

  const handleClean = useCallback(
    () => setValue('to', '', { shouldValidate: formSubmitted }),
    [setValue, formSubmitted]
  );

  const handleBlur = useCallback((e: React.FocusEvent) => {
    if (e.relatedTarget?.id === SELECT_ACCOUNT_BUTTON_ID) return;
    setFocused(false);
  }, []);

  const handleSelectAccount = useCallback(
    (address: string) => {
      setValue('to', address, { shouldValidate: formSubmitted });
      closeSelectModal();
    },
    [closeSelectModal, formSubmitted, setValue]
  );

  const isNonBtc = toAsset.dest !== 'btc';
  const isEvm = toAsset.dest === 'evm';

  return (
    <>
      <div className="my-4">
        <Controller
          name="to"
          control={control}
          rules={{ validate }}
          render={({ field: { onChange, value }, fieldState }) => (
            <NoSpaceField
              value={value ?? ''}
              onChange={onChange}
              onFocus={() => setFocused(true)}
              onBlur={handleBlur}
              extraRightInnerWrapper="unset"
              textarea
              rows={3}
              showPasteButton
              cleanable={Boolean(toValue)}
              onClean={handleClean}
              onPasteButtonClick={handlePasteClick}
              id="cross-chain-to"
              placeholder={t('pasteAddress', DEST_LABEL[toAsset.dest])}
              errorCaption={
                !focused && formSubmitted
                  ? typeof fieldState.error?.message === 'string'
                    ? fieldState.error.message
                    : null
                  : null
              }
              style={{ resize: 'none' }}
            />
          )}
        />
      </div>

      {isNonBtc && !hideSelectAccount && (
        <div className="mb-4">
          <SelectAccountButton value={toValueDebounced ?? ''} onClick={openSelectModal} />
        </div>
      )}

      {isNonBtc && (
        <SelectAccountModal
          selectedAccountAddress={toValueDebounced ?? ''}
          onAccountSelect={handleSelectAccount}
          opened={selectModalOpened}
          onRequestClose={closeSelectModal}
          evm={isEvm}
        />
      )}
    </>
  );
});
