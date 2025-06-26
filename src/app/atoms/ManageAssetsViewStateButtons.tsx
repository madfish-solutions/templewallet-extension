import React, { memo } from 'react';

import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';

import { FilterButton } from './FilterButton';
import { IconButton } from './IconButton';

export const ManageAssetsViewStateButtons = memo(() => {
  const { manageActive, toggleManageActive, filtersOpened, toggleFiltersOpened } = useAssetsViewState();

  return filtersOpened || manageActive ? (
    <>
      <IconButton Icon={CloseIcon} onClick={filtersOpened ? toggleFiltersOpened : toggleManageActive} />
    </>
  ) : (
    <>
      <FilterButton active={filtersOpened} onClick={toggleFiltersOpened} />

      <IconButton Icon={ManageIcon} active={manageActive} onClick={toggleManageActive} />
    </>
  );
});
