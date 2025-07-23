import React, { useState } from 'react';

import { useDebounce } from 'use-debounce';

import { PageTitle } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { SearchBarField } from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { isSearchStringApplicable } from 'lib/utils/search-items';

export const Dapps = () => {
  const [searchValue, setSearchValue] = useState('');
  const [searchValueDebounced] = useDebounce(searchValue, 300);
  const inSearch = isSearchStringApplicable(searchValueDebounced);
  console.log(inSearch);

  return (
    <PageLayout pageTitle={<PageTitle title={t('dApps')} />} contentClassName="!pb-1">
      <SearchBarField value={searchValue} placeholder="Search dapps" onValueChange={setSearchValue} />
      <p>tags</p>
    </PageLayout>
  );
};
