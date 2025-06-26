import React, { FocusEvent, forwardRef, InputHTMLAttributes, memo, useCallback, useRef } from 'react';

import { emptyFn } from '@rnw-community/shared';
import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import CleanButton, { CLEAN_BUTTON_ID } from 'app/atoms/CleanButton';
import { ReactComponent as SearchIcon } from 'app/icons/base/search.svg';
import { setTestID, TestIDProps } from 'lib/analytics';
import { useFocusHandlers } from 'lib/ui/hooks/use-focus-handlers';

const shouldHandleBlur = (e: FocusEvent) => e.relatedTarget?.id !== CLEAN_BUTTON_ID;

interface Props extends InputHTMLAttributes<HTMLInputElement>, TestIDProps {
  value: string;
  onValueChange: (value: string) => void;
  bottomOffset?: string;
  /** @deprecated */
  containerClassName?: string;
  onCleanButtonClick?: () => void;
}

const SearchField = forwardRef<HTMLDivElement, Props>(
  (
    {
      bottomOffset = '0.45rem',
      className,
      containerClassName,
      value,
      placeholder,
      disabled,
      onValueChange,
      onFocus = emptyFn,
      onBlur = emptyFn,
      onCleanButtonClick = emptyFn,
      testID,
      ...rest
    },
    ref
  ) => {
    const inputLocalRef = useRef<HTMLInputElement | null>(null);
    const {
      isFocused: focused,
      onFocus: handleFocus,
      onBlur: handleBlur,
      setIsFocused
    } = useFocusHandlers(onFocus, onBlur, undefined, shouldHandleBlur);

    const handleChange = useCallback(
      (evt: React.ChangeEvent<HTMLInputElement>) => {
        onValueChange(evt.target.value);
      },
      [onValueChange]
    );

    const handleClean = useCallback(() => {
      if (value) {
        inputLocalRef.current?.focus();
        onValueChange('');
      } else {
        inputLocalRef.current?.blur();
        setIsFocused(false);
      }

      onCleanButtonClick();
    }, [onCleanButtonClick, onValueChange, setIsFocused, value]);

    const notEmpty = Boolean(focused || value);

    return (
      <div ref={ref} className={clsx('group relative', containerClassName)}>
        <input
          ref={inputLocalRef}
          type="text"
          className={clsx('appearance-none w-full py-2 px-8 text-font-description', className)}
          value={value}
          spellCheck={false}
          autoComplete="off"
          placeholder={focused ? undefined : placeholder}
          disabled={disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...setTestID(testID)}
          {...rest}
        />

        <IconBase
          Icon={SearchIcon}
          size={12}
          className={clsx(
            'absolute left-3 top-2 pointer-events-none',
            !disabled && 'group-hover:text-primary',
            notEmpty ? 'text-primary' : 'text-grey-1'
          )}
        />

        {notEmpty && <CleanButton className="absolute right-3 bottom-2" onClick={handleClean} />}
      </div>
    );
  }
);

interface SearchBarFieldProps extends Props {
  defaultRightMargin?: boolean;
}

export const SearchBarField = memo(
  forwardRef<HTMLDivElement, SearchBarFieldProps>(
    (
      { className, placeholder = 'Search', defaultRightMargin = true, containerClassName, value, disabled, ...rest },
      ref
    ) => (
      <SearchField
        ref={ref}
        value={value}
        disabled={disabled}
        className={clsx(
          'bg-input-low rounded-lg',
          'placeholder-grey-1 caret-primary',
          !disabled && 'hover:placeholder-text',
          'transition ease-in-out duration-200',
          className
        )}
        containerClassName={clsx('flex-1', defaultRightMargin && 'mr-2', containerClassName)}
        placeholder={placeholder}
        {...rest}
      />
    )
  )
);
