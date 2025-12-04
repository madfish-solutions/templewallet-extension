import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import { useBooleanState } from 'lib/ui/hooks';
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

  const [autoFocusEnabled, setAutoFocusEnabled, setAutoFocusDisabled] = useBooleanState(false);

  const tokensRef = useRef<HTMLDivElement>(null);
  const collectiblesRef = useRef<HTMLDivElement>(null);

  const {
    filtersOpened,
    setManageActive,
    setManageInactive,
    setFiltersOpened,
    setFiltersClosed,
    searchMode,
    setSearchModeActive,
    setSearchModeInactive,
    searchValue,
    setSearchValue,
    resetSearchValue
  } = useAssetsViewState();

  useEffect(() => void setTab(tabSlug ?? 'tokens'), [tabSlug]);

  const handleClose = useCallback(() => {
    setAutoFocusDisabled();
    setFiltersClosed();
    setManageInactive();
    setSearchModeInactive();
    resetSearchValue();
  }, [setAutoFocusDisabled, setFiltersClosed, setManageInactive, setSearchModeInactive, resetSearchValue]);

  useWillUnmount(handleClose);

  const handleTabChange = useCallback((val: string) => {
    setTab(val);
    navigate({ search: `tab=${val}` }, HistoryAction.Replace);
  }, []);

  const handleSearch = useCallback(() => {
    setAutoFocusEnabled();
    setSearchModeActive();
  }, [setAutoFocusEnabled, setSearchModeActive]);

  const handleFilters = useCallback(() => {
    setSearchModeActive();
    setFiltersOpened();
  }, [setSearchModeActive, setFiltersOpened]);

  const handleManage = useCallback(() => {
    setSearchModeActive();
    setManageActive();
  }, [setSearchModeActive, setManageActive]);

  if (searchMode) {
    return (
      <div className={clsx('flex gap-4 items-center px-4 py-3', className)}>
        <SearchBarField
          value={searchValue}
          disabled={filtersOpened}
          autoFocus={autoFocusEnabled}
          onValueChange={setSearchValue}
          defaultRightMargin={false}
        />
        <IconButton Icon={CloseIcon} onClick={handleClose} />
      </div>
    );
  }

  return (
    <div className={clsx('flex gap-8 items-center px-4 py-3', className)}>
      <SegmentedControl
        name="assets-segment-control"
        activeSegment={tab}
        setActiveSegment={handleTabChange}
        className="flex-1"
        controlsClassName="h-8"
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
        <IconButton Icon={SearchIcon} onClick={handleSearch} />
        <FilterButton onClick={handleFilters} />
        <IconButton Icon={ManageIcon} onClick={handleManage} />
      </div>
    </div>
  );
});

interface IconButtonProps {
  Icon: ImportedSVGComponent;
  onClick: EmptyFn;
  active?: boolean;
}

const IconButton = memo<IconButtonProps>(({ Icon, onClick, active }) => (
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

const FilterButton = memo<{ onClick: EmptyFn }>(({ onClick }) => {
  const options = useAssetsFilterOptionsSelector();

  const isNonDefaultOption = useMemo(() => !isEqual(options, AssetsFilterOptionsInitialState), [options]);

  return <IconButton Icon={isNonDefaultOption ? FilterOnIcon : FilterOffIcon} onClick={onClick} />;
});
