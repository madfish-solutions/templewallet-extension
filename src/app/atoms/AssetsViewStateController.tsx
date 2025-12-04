import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ReactComponent as SearchIcon } from 'app/icons/base/search.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { SearchBarField } from 'app/templates/SearchField';
import { t } from 'lib/i18n';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';
import { HistoryAction, navigate } from 'lib/woozie';

import { Button } from './Button';
import { FilterButton } from './FilterButton';
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
    setManageActive,
    setManageInactive,
    filtersOpened,
    setFiltersClosed,
    toggleFiltersOpened,
    searchMode,
    setSearchModeActive,
    setSearchModeInactive,
    searchValue,
    setSearchValue,
    resetSearchValue
  } = useAssetsViewState();

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

  const handleManage = useCallback(() => {
    setSearchModeActive();
    setManageActive();
  }, [setSearchModeActive, setManageActive]);

  const handleClose = useCallback(() => {
    resetSearchValue();
    setSearchModeInactive();
    setManageInactive();
  }, [resetSearchValue, setSearchModeInactive, setManageInactive]);

  if (searchMode) {
    return (
      <div className={clsx('flex gap-4 items-center px-4 pt-3 pb-2', className)}>
        <SearchBarField value={searchValue} onValueChange={setSearchValue} defaultRightMargin={false} />
        <IconButton Icon={CloseIcon} onClick={handleClose} />
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
        <IconButton Icon={SearchIcon} onClick={setSearchModeActive} />
        <FilterButton active={filtersOpened} onClick={toggleFiltersOpened} />
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
