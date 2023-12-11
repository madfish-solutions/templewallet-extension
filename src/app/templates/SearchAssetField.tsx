import React, { FC } from 'react';

import clsx from 'clsx';

import SearchField, { SearchFieldProps } from 'app/templates/SearchField';
import { t } from 'lib/i18n';

type SearchAssetFieldProps = SearchFieldProps;

const SearchAssetField: FC<SearchAssetFieldProps> = ({ className, value, ...rest }) => (
  <SearchField
    value={value}
    isCleanButtonVisible={Boolean(value)}
    className={clsx(
      'py-2 pl-8 pr-4 bg-gray-100',
      'rounded-lg border border-bgheader outline-none border-gray-300',
      'transition ease-in-out duration-200',
      'text-gray-500 text-sm leading-tight',
      'placeholder-gray-500 focus:text-gray-700',
      className
    )}
    placeholder={t('searchAssets')}
    searchIconClassName="h-5 w-auto"
    searchIconWrapperClassName="px-2 text-gray-600"
    {...rest}
  />
);

export default SearchAssetField;
