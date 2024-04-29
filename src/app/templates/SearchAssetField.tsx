import React, { memo } from 'react';

import clsx from 'clsx';

import SearchField, { SearchFieldProps } from 'app/templates/SearchField';

type SearchAssetFieldProps = SearchFieldProps;

const SearchAssetField = memo<SearchAssetFieldProps>(({ className, value, ...rest }) => (
  <SearchField
    value={value}
    className={clsx(
      'bg-input-low rounded-lg placeholder-gray-550 hover:placeholder-text',
      'transition ease-in-out duration-200',
      className
    )}
    placeholder="Search"
    {...rest}
  />
));

export default SearchAssetField;
