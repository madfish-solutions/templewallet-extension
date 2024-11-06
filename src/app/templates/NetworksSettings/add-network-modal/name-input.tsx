import React, { FC, MutableRefObject, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import clsx from 'clsx';
import { uniqBy } from 'lodash';
import { useFormContext } from 'react-hook-form-v7';

import { FormField } from 'app/atoms';
import { FormFieldElement } from 'app/atoms/FormField';
import { EvmNetworkLogo } from 'app/atoms/NetworkLogo';
import { T, t } from 'lib/i18n';
import { useFocusHandlers } from 'lib/ui/hooks/use-focus-handlers';
import { combineRefs } from 'lib/ui/utils';
import { searchAndFilterItems } from 'lib/utils/search-items';
import { getViemChainsList } from 'temple/evm/utils';
import { useAllEvmChains } from 'temple/front';

import { NetworkSettingsSelectors } from '../selectors';

import { AddNetworkFormValues, ViemChain } from './types';

interface NameInputProps {
  namesToExclude: string[];
  onChainSelect: SyncFn<ViemChain>;
}

const inputId = 'new-network-name';

export const NameInput = memo(({ namesToExclude, onChainSelect }: NameInputProps) => {
  const existentEvmChains = useAllEvmChains();
  const { register, setValue, watch, formState } = useFormContext<AddNetworkFormValues>();
  const { submitCount, errors } = formState;
  const inputValue = watch('name');
  const wasSubmitted = submitCount > 0;

  const fieldRef = useRef<FormFieldElement>(null);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [focusedVariantIndex, setFocusedVariantIndex] = useState(-1);
  const unsetFocusedVariantIndex = useCallback(() => setFocusedVariantIndex(-1), []);
  const variantsRef = useRef<Array<HTMLButtonElement | null>>([]);

  const shouldHandleBlur = useCallback((e: React.FocusEvent) => !checkRelatedTarget(e.relatedTarget?.id), []);
  const {
    isFocused,
    onFocus: handleFocus,
    onBlur: handleBlur,
    setIsFocused
  } = useFocusHandlers(undefined, unsetFocusedVariantIndex, undefined, shouldHandleBlur);
  const isBlur = !isFocused;

  const allVariants = useMemo(
    () =>
      uniqBy(
        getViemChainsList().filter(({ id }) => !existentEvmChains[id]),
        ({ id, name }) => `${id}-${name}`
      ),
    [existentEvmChains]
  );
  const autoCompleteVariants: ViemChain[] | null = useMemo(
    () =>
      inputValue ? searchAndFilterItems(allVariants, inputValue, [{ name: 'name', weight: 1 }]).slice(0, 3) : null,
    [allVariants, inputValue]
  );

  useEffect(() => {
    if (isBlur) {
      setShowAutoComplete(false);
      return;
    }

    if (inputValue && inputValue.length > 1) {
      setShowAutoComplete(true);
      return;
    }

    setShowAutoComplete(false);
  }, [showAutoComplete, inputValue, isBlur]);
  useEffect(() => variantsRef.current[focusedVariantIndex]?.focus(), [focusedVariantIndex]);

  const setValueToVariant = useCallback(
    (variant: ViemChain) => {
      setValue('name', variant.name, { shouldValidate: true });
      onChainSelect(variant);
      setIsFocused(false);
    },
    [onChainSelect, setIsFocused, setValue]
  );

  const handleVariantClick = useCallback(
    (_: React.MouseEvent<HTMLButtonElement, MouseEvent>, variant: ViemChain) => {
      setValueToVariant(variant);
    },
    [setValueToVariant]
  );

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!autoCompleteVariants || autoCompleteVariants.length === 0) {
        return;
      }

      if (e.key === 'Tab' || e.key === 'Enter') {
        setValueToVariant(autoCompleteVariants[0]);
      }

      if (e.key === 'ArrowDown' && autoCompleteVariants.length > 1) {
        e.preventDefault();
        setFocusedVariantIndex(1);
      }
    },
    [autoCompleteVariants, setValueToVariant]
  );

  const handleVariantKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, variant: ViemChain) => {
      if (!autoCompleteVariants || autoCompleteVariants.length === 0) {
        return;
      }

      if (e.key === 'Tab' || e.key === 'Enter') {
        setValueToVariant(variant);
      }

      if (e.key === 'ArrowDown') {
        if (focusedVariantIndex < autoCompleteVariants.length - 1) {
          setFocusedVariantIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowUp') {
        if (focusedVariantIndex === 0) {
          fieldRef.current?.focus();
          setFocusedVariantIndex(-1);
        }

        if (focusedVariantIndex > 0) {
          setFocusedVariantIndex(prev => prev - 1);
        }
      }
    },
    [autoCompleteVariants, focusedVariantIndex, setValueToVariant]
  );

  const { ref: formNameFieldRef, ...restNameFieldProps } = register('name', {
    required: t('required'),
    validate: value => (namesToExclude.includes(value) ? t('mustBeUnique') : true),
    onBlur: handleBlur
  });

  return (
    <div className="flex flex-col relative">
      <FormField
        {...restNameFieldProps}
        ref={combineRefs(formNameFieldRef, fieldRef)}
        type="text"
        label={<T id="name" />}
        id={inputId}
        fieldWrapperBottomMargin={false}
        errorCaption={wasSubmitted && errors.name?.message}
        placeholder="Ethereum"
        autoComplete="off"
        testID={NetworkSettingsSelectors.newNetworkNameInput}
        onKeyDown={handleInputKeyDown}
        onFocus={handleFocus}
      />
      {showAutoComplete && autoCompleteVariants && autoCompleteVariants.length > 0 && (
        <div
          className={clsx(
            'w-full rounded-md bg-white shadow-bottom text-font-medium absolute left-0 z-dropdown p-2 flex flex-col'
          )}
          style={{ top: 'calc(100% + 0.5rem)' }}
        >
          {autoCompleteVariants.map((variant, index) => (
            <ChainVariant
              key={variant.id}
              variant={variant}
              index={index}
              variantsRef={variantsRef}
              onClick={handleVariantClick}
              onKeyDown={handleVariantKeyDown}
              onBlur={handleBlur}
            />
          ))}
        </div>
      )}
    </div>
  );
});

interface ChainVariantProps {
  variant: ViemChain;
  index: number;
  variantsRef: MutableRefObject<(HTMLButtonElement | null)[]>;
  onClick: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, variant: ViemChain) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>, variant: ViemChain) => void;
  onBlur: SyncFn<React.FocusEvent>;
}

const ChainVariant: FC<ChainVariantProps> = ({ variant, index, variantsRef, onClick, onKeyDown, onBlur }) => {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      e.preventDefault();

      onClick(e, variant);
    },
    [onClick, variant]
  );
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
      }

      onKeyDown(e, variant);
    },
    [onKeyDown, variant]
  );

  return (
    <button
      key={variant.id}
      id={`autoCompleteVariant-${variant.id}-${variant.name}`}
      ref={el => (variantsRef.current[index] = el)}
      className={clsx(
        'px-2 py-2.5 w-full text-left rounded-md flex justify-between items-center',
        'hover:bg-secondary-low focus:bg-grey-4 focus:outline-none'
      )}
      onClick={handleClick}
      onBlur={onBlur}
      onKeyDown={handleKeyDown}
      type="button"
    >
      {variant.name}

      <EvmNetworkLogo chainId={variant.id} size={24} />
    </button>
  );
};

const checkRelatedTarget = (targetId?: string) => targetId?.startsWith('autoCompleteVariant');
