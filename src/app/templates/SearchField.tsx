import React, { FC, InputHTMLAttributes, useCallback } from 'react';

import classNames from 'clsx';

import CleanButton from 'app/atoms/CleanButton';
import { ReactComponent as SearchIcon } from 'app/icons/search.svg';
import { setTestID, TestIDProps } from 'lib/analytics';

type SearchFieldProps = InputHTMLAttributes<HTMLInputElement> &
  TestIDProps & {
    bottomOffset?: string;
    containerClassName?: string;
    searchIconClassName?: string;
    searchIconWrapperClassName?: string;
    cleanButtonStyle?: React.CSSProperties;
    cleanButtonIconStyle?: React.CSSProperties;
    value: string;
    onValueChange: (v: string) => void;
  };

const SearchField: FC<SearchFieldProps> = ({
  bottomOffset = '0.45rem',
  className,
  containerClassName,
  value,
  onValueChange,
  searchIconClassName,
  searchIconWrapperClassName,
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

        <div className={classNames('absolute left-0 top-0 bottom-0 flex items-center', searchIconWrapperClassName)}>
          <SearchIcon className={classNames('stroke-current', searchIconClassName)} />
        </div>

        {Boolean(value) && (
          <CleanButton
            bottomOffset={bottomOffset}
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
