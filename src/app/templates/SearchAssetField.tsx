import React, { memo } from 'react';

import clsx from 'clsx';

import SearchField, { SearchFieldProps } from 'app/templates/SearchField';
import { t } from 'lib/i18n';

type SearchAssetFieldProps = SearchFieldProps;

const SearchAssetField = memo<SearchAssetFieldProps>(({ className, ...rest }) => (
  <SearchField
    className={clsx(
      'bg-gray-100 text-gray-500',
      'placeholder-gray-500 focus:text-gray-700',
      'rounded-lg border border-bgheader outline-none border-gray-300',
      'transition ease-in-out duration-200',
      className
    )}
    placeholder={t('searchAssets')}
    searchIconClassName="h-5 w-auto"
    searchIconWrapperClassName="px-2 text-gray-600"
    {...rest}
  />
));

export default SearchAssetField;
