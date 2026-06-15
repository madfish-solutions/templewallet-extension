import React, { useState } from 'react';

import { isDefined } from '@rnw-community/shared';
import clsx from 'clsx';
import { Controller, useFormContext, useFormState, useWatch } from 'react-hook-form';
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
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
}

const DEST_LABEL: Record<CrossChainDest, string> = {
  btc: 'Bitcoin',
  evm: 'EVM',
  tezos: 'Tezos'
};

export const RecipientField: React.FC<Props> = ({ fromAsset, toAsset }) => {
  const { control, setValue } = useFormContext<CrossChainFormData>();
  const { submitCount } = useFormState<CrossChainFormData>({ control, name: 'to' });

  const toValue = useWatch({ control, name: 'to' });
  const [toValueDebounced] = useDebounce(toValue, 300);
  const formSubmitted = submitCount > 0;

  const [focused, setFocused] = useState(false);
  const [selectModalOpened, openSelectModal, closeSelectModal] = useBooleanState(false);

  const validate = (value: string) => {
    const result = validateCrossChainRecipient(value, toAsset);
    return result === true ? true : t(result);
  };

  const handlePasteClick = () => {
    readClipboard().then(value => setValue('to', value, { shouldValidate: formSubmitted }));
  };

  const handleClean = () => setValue('to', '', { shouldValidate: formSubmitted });

  const handleBlur = (e: React.FocusEvent) => {
    if (e.relatedTarget?.id === SELECT_ACCOUNT_BUTTON_ID) return;
    setFocused(false);
  };

  const handleSelectAccount = (address: string) => {
    setValue('to', address, { shouldValidate: formSubmitted });
    closeSelectModal();
  };

  const handleSelectAccountButtonClick = () => {
    setFocused(false);
    openSelectModal();
  };

  const isNonBtc = toAsset.dest !== 'btc';
  const showSelectAccount = isNonBtc && focused;
  const isEvm = toAsset.dest === 'evm';
  const includeCurrentAccount =
    (fromAsset.dest === 'evm' && toAsset.dest === 'tezos') || (fromAsset.dest === 'tezos' && toAsset.dest === 'evm');

  return (
    <>
      <div className="mt-2">
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
              reserveSpaceForError={false}
              fieldWrapperBottomMargin={isDefined(fieldState.error?.message)}
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

      {isNonBtc && (
        <>
          <div
            inert={showSelectAccount ? undefined : true}
            className={clsx(
              'grid overflow-hidden transition-[grid-template-rows,margin-top] duration-200 ease-in-out',
              showSelectAccount ? 'grid-rows-[1fr] mt-2' : 'grid-rows-[0fr] mt-0 pointer-events-none'
            )}
          >
            <div className="min-h-0">
              <SelectAccountButton value={toValueDebounced ?? ''} onClick={handleSelectAccountButtonClick} />
            </div>
          </div>
          <SelectAccountModal
            selectedAccountAddress={toValueDebounced ?? ''}
            onAccountSelect={handleSelectAccount}
            opened={selectModalOpened}
            onRequestClose={closeSelectModal}
            evm={isEvm}
            includeCurrentAccount={includeCurrentAccount}
          />
        </>
      )}
    </>
  );
};
