import React, { FC, InputHTMLAttributes, useCallback, useRef, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';
import classNames from 'clsx';

import CleanButton, { CLEAN_BUTTON_ID } from 'app/atoms/CleanButton';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { setTestID, TestIDProps } from 'lib/analytics';

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement>, TestIDProps {
  value: string;
  onValueChange: (value: string) => void;
  bottomOffset?: string;
  containerClassName?: string;
  searchIconClassName?: string;
  searchIconWrapperClassName?: string;
  cleanButtonClassName?: string;
  cleanButtonIconClassName?: string;
  searchIconStyle?: React.CSSProperties;
  cleanButtonStyle?: React.CSSProperties;
  cleanButtonIconStyle?: React.CSSProperties;
  onCleanButtonClick?: () => void;
}

const SearchField: FC<SearchFieldProps> = ({
  bottomOffset = '0.45rem',
  className,
  containerClassName,
  value,
  onValueChange,
  onFocus = emptyFn,
  onBlur = emptyFn,
  onCleanButtonClick = emptyFn,
  searchIconClassName,
  searchIconWrapperClassName,
  cleanButtonClassName,
  searchIconStyle,
  cleanButtonIconClassName,
  cleanButtonStyle,
  cleanButtonIconStyle,
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

  return (
    <div className={classNames('w-full flex flex-col', containerClassName)}>
      <div className="relative flex items-stretch">
        <input
          ref={inputRef}
          type="text"
          className={classNames('appearance-none w-full py-2 pl-8 pr-8 text-sm leading-tight', className)}
          value={value}
          spellCheck={false}
          autoComplete="off"
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...setTestID(testID)}
          {...rest}
        />

        <div
          className={classNames(
            'absolute left-0 top-0 bottom-0 flex items-center pointer-events-none',
            searchIconWrapperClassName
          )}
        >
          <SearchIcon style={searchIconStyle} className={classNames('stroke-current', searchIconClassName)} />
        </div>

        {focused && (
          <CleanButton
            bottomOffset={bottomOffset}
            className={cleanButtonClassName}
            iconClassName={cleanButtonIconClassName}
            style={cleanButtonStyle}
            iconStyle={cleanButtonIconStyle}
            onClick={handleClean}
          />
        )}
      </div>
    </div>
  );
};

export default SearchField;
