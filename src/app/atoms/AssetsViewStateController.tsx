import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';
import { isEqual } from 'lodash';

import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ReactComponent as SearchIcon } from 'app/icons/base/search.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptionsInitialState } from 'app/store/assets-filter-options/state';
import { SearchBarField } from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';
import { HistoryAction, navigate } from 'lib/woozie';

import { Button } from './Button';
import { IconBase } from './IconBase';
import SegmentedControl from './SegmentedControl';

interface AssetsSegmentControlProps {
  className?: string;
}

export const AssetsViewStateController = memo<AssetsSegmentControlProps>(({ className }) => {
  const [tabSlug] = useLocationSearchParamValue('tab');
  const [tab, setTab] = useState(tabSlug ?? 'tokens');

  const tokensRef = useRef<HTMLDivElement>(null);
  const collectiblesRef = useRef<HTMLDivElement>(null);

  const {
    searchMode,
    setSearchModeActive,
    setSearchModeInactive,
    manageActive,
    setManageInactive,
    toggleManageActive,
    filtersOpened,
    setFiltersClosed,
    toggleFiltersOpened,
    searchValue,
    setSearchValue,
    resetSearchValue
  } = useAssetsViewState();

  const options = useAssetsFilterOptionsSelector();
  const isNonDefaultOption = !isEqual(options, AssetsFilterOptionsInitialState);

  useEffect(() => void setTab(tabSlug ?? 'tokens'), [tabSlug]);

  useWillUnmount(() => {
    setFiltersClosed();
    setManageInactive();
    setSearchModeInactive();
    resetSearchValue();
  });

  const handleTabChange = useCallback((val: string) => {
    setTab(val);
    navigate({ search: `tab=${val}` }, HistoryAction.Replace);
  }, []);

  const handleSearchClick = useCallback(() => {
    setSearchModeActive();
  }, [setSearchModeActive]);

  const handleCloseSearch = useCallback(() => {
    resetSearchValue();
    setSearchModeInactive();
  }, [resetSearchValue, setSearchModeInactive]);

  const handleFilterClick = useCallback(() => {
    toggleFiltersOpened();
  }, [toggleFiltersOpened]);

  const handleManageClick = useCallback(() => {
    toggleManageActive();
  }, [toggleManageActive]);

  if (searchMode) {
    return (
      <div className={clsx('flex gap-4 items-center px-4 pt-3 pb-2', className)}>
        <SearchBarField value={searchValue} onValueChange={setSearchValue} defaultRightMargin={false} />
        <AssetsBarIconButton Icon={CloseIcon} onClick={handleCloseSearch} />
      </div>
    );
  }

  return (
    <div className={clsx('flex gap-8 items-center px-4 pt-3 pb-2', className)}>
      <SegmentedControl
        name="assets-segment-control"
        activeSegment={tab}
        setActiveSegment={handleTabChange}
        className="flex-1"
        segments={[
          {
            label: t('tokens'),
            value: 'tokens',
            ref: tokensRef
          },
          {
            label: t('nfts'),
            value: 'collectibles',
            ref: collectiblesRef
          }
        ]}
      />
      <div className="flex gap-2 items-center">
        <AssetsBarIconButton Icon={SearchIcon} onClick={handleSearchClick} />
        <AssetsBarIconButton
          Icon={filtersOpened ? CloseIcon : !filtersOpened && isNonDefaultOption ? FilterOnIcon : FilterOffIcon}
          onClick={handleFilterClick}
          active={filtersOpened}
        />
        <AssetsBarIconButton
          Icon={manageActive ? CloseIcon : ManageIcon}
          onClick={handleManageClick}
          active={manageActive}
        />
      </div>
    </div>
  );
});

interface AssetsBarIconButtonProps {
  Icon: ImportedSVGComponent;
  onClick: EmptyFn;
  active?: boolean;
}

const AssetsBarIconButton = memo<AssetsBarIconButtonProps>(({ Icon, onClick, active }) => (
  <Button
    className={clsx(
      'p-1 rounded-md overflow-hidden',
      active ? 'bg-primary-low text-primary' : 'bg-white text-primary border-0.5 border-lines hover:bg-grey-4'
    )}
    onClick={onClick}
  >
    <IconBase Icon={Icon} />
  </Button>
));
