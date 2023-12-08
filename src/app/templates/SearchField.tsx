import React, { FC, InputHTMLAttributes, useCallback } from 'react';

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
  value: string;
  onValueChange: (value: string) => void;
}

const SearchField: FC<SearchFieldProps> = ({
  bottomOffset = '0.45rem',
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
  const handleChange = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange(evt.target.value);
    },
    [onValueChange]
  );

  const handleClean = useCallback(() => {
    onValueChange('');
  }, [onValueChange]);

  return (
    <div className={classNames('w-full flex flex-col', containerClassName)}>
      <div className="relative flex items-stretch">
        <input
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

        {Boolean(value) && (
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
