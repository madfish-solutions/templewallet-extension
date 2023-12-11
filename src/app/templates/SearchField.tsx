import React, { FC, InputHTMLAttributes, useCallback, useRef } from 'react';

import classNames from 'clsx';

import CleanButton from 'app/atoms/CleanButton';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { setTestID, TestIDProps } from 'lib/analytics';

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement>, TestIDProps {
  bottomOffset?: string;
  containerClassName?: string;
  searchIconClassName?: string;
  searchIconWrapperClassName?: string;
  cleanButtonClassName?: string;
  cleanButtonIconClassName?: string;
  searchIconStyle?: React.CSSProperties;
  cleanButtonStyle?: React.CSSProperties;
  cleanButtonIconStyle?: React.CSSProperties;
  isCleanButtonVisible?: boolean;
  value: string;
  onValueChange: (value: string) => void;
}

const SearchField: FC<SearchFieldProps> = ({
  bottomOffset = '0.45rem',
  isCleanButtonVisible = true,
  className,
  containerClassName,
  value,
  onValueChange,
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange(evt.target.value);
    },
    [onValueChange]
  );

  const handleClean = useCallback(() => {
    if (value) {
      inputRef.current?.focus();
    }

    onValueChange('');
  }, [onValueChange, value]);

  return (
    <div className={classNames('w-full flex flex-col', containerClassName)}>
      <div className="relative flex items-stretch">
        <input
          ref={inputRef}
          type="text"
          className={classNames('appearance-none w-full', className)}
          value={value}
          spellCheck={false}
          autoComplete="off"
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

        {isCleanButtonVisible && (
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
