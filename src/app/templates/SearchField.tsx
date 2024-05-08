import React, { FC, InputHTMLAttributes, memo, useCallback, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';
import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import CleanButton, { CLEAN_BUTTON_ID } from 'app/atoms/CleanButton';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { setTestID, TestIDProps } from 'lib/analytics';

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement>, TestIDProps {
  value: string;
  onValueChange: (value: string) => void;
  bottomOffset?: string;
  containerClassName?: string;
  onCleanButtonClick?: () => void;
}

const SearchField: FC<SearchFieldProps> = ({
  bottomOffset = '0.45rem',
  className,
  containerClassName,
  value,
  placeholder,
  onValueChange,
  onFocus = emptyFn,
  onBlur = emptyFn,
  onCleanButtonClick = emptyFn,
  testID,
  ...rest
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focused, setFocused] = useState(false);

  const handleChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange(evt.target.value);
    },
    [onValueChange]
  );

  const handleFocus = useCallback(
    (evt: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus(evt);
    },
    [onFocus]
  );

  const handleBlur = useCallback(
    (evt: React.FocusEvent<HTMLInputElement>) => {
      if (evt.relatedTarget?.id === CLEAN_BUTTON_ID) {
        return;
      }

      setFocused(false);
      onBlur(evt);
    },
    [onBlur]
  );

  const handleClean = useCallback(() => {
    if (value) {
      inputRef.current?.focus();
      onValueChange('');
    } else {
      inputRef.current?.blur();
      setFocused(false);
    }

    onCleanButtonClick();
  }, [onCleanButtonClick, onValueChange, value]);

  const notEmpty = Boolean(focused || value);

  return (
    <div className={clsx('group relative', containerClassName)}>
      <input
        ref={inputRef}
        type="text"
        className={clsx('appearance-none w-full py-2 px-8 text-xs', className)}
        value={value}
        spellCheck={false}
        autoComplete="off"
        placeholder={focused ? undefined : placeholder}
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
          'group-hover:text-primary absolute left-3 top-2 pointer-events-none',
          notEmpty ? 'text-primary' : 'text-grey-1'
        )}
      />

      {notEmpty && <CleanButton onClick={handleClean} />}
    </div>
  );
};

export default SearchField;

export const SearchBarField = memo<SearchFieldProps>(({ className, containerClassName, value, ...rest }) => (
  <SearchField
    value={value}
    className={clsx(
      'bg-input-low rounded-lg placeholder-grey-1 hover:placeholder-text caret-primary',
      'transition ease-in-out duration-200',
      className
    )}
    containerClassName={clsx('flex-1 mr-2', containerClassName)}
    placeholder="Search"
    {...rest}
  />
));
