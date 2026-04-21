import React, { memo, useCallback, useEffect, useRef, useState } from 'react';

import clsx from 'clsx';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { useManageState, useSearchModeState, useSearchState } from 'app/hooks/use-assets-view-state';
import { useLocationSearchParamValue } from 'app/hooks/use-location';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ReactComponent as SearchIcon } from 'app/icons/base/search.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
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
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const { setManageActive, setManageInactive } = useManageState();
  const { searchValue, setSearchValue, resetSearchValue } = useSearchState();
  const { searchMode, setSearchModeActive, setSearchModeInactive } = useSearchModeState();

  useEffect(() => void setTab(tabSlug ?? 'tokens'), [tabSlug]);

  const handleClose = useCallback(() => {
    setManageInactive();
    setSearchModeInactive();
    resetSearchValue();
  }, [setManageInactive, setSearchModeInactive, resetSearchValue]);

  useWillUnmount(handleClose);

  const handleTabChange = useCallback((val: string) => {
    setTab(val);
    navigate({ search: `tab=${val}` }, HistoryAction.Replace);
  }, []);

  const handleSearch = useCallback(() => {
    setSearchModeActive();
    // input's hidden to visible transition interrupts sync invocation
    setTimeout(() => void searchInputRef.current?.focus());
  }, [setSearchModeActive]);

  const handleManage = useCallback(() => {
    setSearchModeActive();
    setManageActive();
  }, [setSearchModeActive, setManageActive]);

  return (
    <div className={clsx('relative px-4 py-3', className)}>
      <FadeTransition trigger={searchMode}>
        <div className={clsx('items-center gap-4', searchMode ? 'flex' : 'hidden overflow-hidden')}>
          <SearchBarField
            autoFocus
            value={searchValue}
            inputRef={searchInputRef}
            onValueChange={setSearchValue}
            defaultRightMargin={false}
          />
          <IconButton Icon={CloseIcon} onClick={handleClose} />
        </div>

        <div className={clsx('gap-x-18 items-center', searchMode ? 'hidden overflow-hidden' : 'flex')}>
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
            <IconButton Icon={ManageIcon} onClick={handleManage} />
          </div>
        </div>
      </FadeTransition>
    </div>
  );
});

interface IconButtonProps {
  Icon: ImportedSVGComponent;
  onClick: EmptyFn;
  active?: boolean;
}

const IconButton = ({ Icon, onClick, active }: IconButtonProps) => (
  <Button
    className={clsx(
      'p-1 rounded-md overflow-hidden',
      active ? 'bg-primary-low text-primary' : 'bg-white text-primary border-0.5 border-lines hover:bg-grey-4'
    )}
    onClick={onClick}
  >
    <IconBase Icon={Icon} />
  </Button>
);
