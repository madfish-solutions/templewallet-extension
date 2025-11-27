import React, { memo, useCallback, useRef, useState, useEffect } from 'react';

import clsx from 'clsx';
import { isEqual } from 'lodash';

import { useAssetsViewState } from 'app/hooks/use-assets-view-state';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ReactComponent as SearchIcon } from 'app/icons/base/search.svg';
import { ReactComponent as CloseIcon } from 'app/icons/base/x.svg';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptionsInitialState } from 'app/store/assets-filter-options/state';
import { useWillUnmount } from 'lib/ui/hooks/useWillUnmount';

import { Button } from '../Button';
import CleanButton from '../CleanButton';
import { IconBase } from '../IconBase';

import styles from './styles.module.css';

interface AssetsBarProps {
  tabSlug: string | null;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  onTokensTabClick: EmptyFn;
  onCollectiblesTabClick: EmptyFn;
  className?: string;
}

export const AssetsBar = memo<AssetsBarProps>(
  ({ tabSlug, searchValue, onSearchValueChange, onTokensTabClick, onCollectiblesTabClick, className }) => {
    const [tab, setTab] = useState(tabSlug ?? 'tokens');
    const tokensRef = useRef<HTMLDivElement>(null);
    const nftsRef = useRef<HTMLDivElement>(null);
    const controlRef = useRef<HTMLDivElement>(null);

    const {
      searchMode,
      setSearchModeActive,
      setSearchModeInactive,
      manageActive,
      setManageInactive,
      toggleManageActive,
      filtersOpened,
      setFiltersClosed,
      toggleFiltersOpened
    } = useAssetsViewState();

    const options = useAssetsFilterOptionsSelector();
    const isNonDefaultOption = !isEqual(options, AssetsFilterOptionsInitialState);

    useEffect(() => void setTab(tabSlug ?? 'tokens'), [tabSlug]);

    useWillUnmount(() => {
      setFiltersClosed();
      setManageInactive();
      setSearchModeInactive();
    });

    const handleTabChange = useCallback(
      (val: string) => {
        if (val === 'tokens') onTokensTabClick();
        else onCollectiblesTabClick();
        setTab(val);
      },
      [onTokensTabClick, onCollectiblesTabClick]
    );

    // Update highlight position when tab changes
    useEffect(() => {
      const activeRef = tab === 'tokens' ? tokensRef : nftsRef;

      if (activeRef?.current && controlRef.current) {
        const { offsetWidth, offsetLeft } = activeRef.current;
        const { style } = controlRef.current;

        style.setProperty('--highlight-width', `${offsetWidth}px`);
        style.setProperty('--highlight-x-pos', `${offsetLeft}px`);
      }
    }, [tab]);

    const handleSearchClick = useCallback(() => {
      setSearchModeActive();
    }, [setSearchModeActive]);

    const handleCloseSearch = useCallback(() => {
      onSearchValueChange('');
      setSearchModeInactive();
    }, [onSearchValueChange, setSearchModeInactive]);

    const handleSearchChange = useCallback(
      (evt: React.ChangeEvent<HTMLInputElement>) => {
        onSearchValueChange(evt.target.value);
      },
      [onSearchValueChange]
    );

    const handleCleanSearch = useCallback(() => {
      onSearchValueChange('');
    }, [onSearchValueChange]);

    // Close button handler for filter/manage mode
    const handleCloseManageOrFilter = useCallback(() => {
      if (filtersOpened) toggleFiltersOpened();
      else if (manageActive) toggleManageActive();
    }, [filtersOpened, manageActive, toggleFiltersOpened, toggleManageActive]);

    if (searchMode) {
      return (
        <div className={clsx('flex gap-4 items-center px-4 pt-3 pb-2', className)}>
          <div className="flex-1 bg-input-low rounded-lg h-8 flex items-center justify-between px-3 py-0.5">
            <div className="flex gap-0.5 items-center flex-1">
              <IconBase Icon={SearchIcon} className="text-primary" />
              <input
                type="text"
                value={searchValue}
                onChange={handleSearchChange}
                placeholder="Search"
                className="flex-1 bg-transparent text-font-description text-text border-none outline-none placeholder-grey-1"
                autoFocus
              />
            </div>
            {searchValue && <CleanButton onClick={handleCleanSearch} className="ml-1" />}
          </div>
          <AssetsBarIconButton Icon={CloseIcon} onClick={handleCloseSearch} />
        </div>
      );
    }

    // Filter/Manage mode - show close button only
    if (filtersOpened || manageActive) {
      return (
        <div className={clsx('flex gap-8 items-center px-4 pt-3 pb-2', className)}>
          <SegmentControl
            controlRef={controlRef}
            tokensRef={tokensRef}
            nftsRef={nftsRef}
            activeTab={tab}
            onTabChange={handleTabChange}
            disabled
          />
          <div className="flex gap-2 items-center">
            <AssetsBarIconButton Icon={CloseIcon} onClick={handleCloseManageOrFilter} />
          </div>
        </div>
      );
    }

    return (
      <div className={clsx('flex gap-8 items-center px-4 pt-3 pb-2', className)}>
        <SegmentControl
          controlRef={controlRef}
          tokensRef={tokensRef}
          nftsRef={nftsRef}
          activeTab={tab}
          onTabChange={handleTabChange}
        />
        <div className="flex gap-2 items-center">
          <AssetsBarIconButton Icon={SearchIcon} onClick={handleSearchClick} />
          <AssetsBarIconButton
            Icon={!filtersOpened && isNonDefaultOption ? FilterOnIcon : FilterOffIcon}
            onClick={toggleFiltersOpened}
          />
          <AssetsBarIconButton Icon={ManageIcon} onClick={toggleManageActive} />
        </div>
      </div>
    );
  }
);

interface SegmentControlProps {
  controlRef: React.RefObject<HTMLDivElement>;
  tokensRef: React.RefObject<HTMLDivElement>;
  nftsRef: React.RefObject<HTMLDivElement>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  disabled?: boolean;
}

const SegmentControl = memo<SegmentControlProps>(
  ({ controlRef, tokensRef, nftsRef, activeTab, onTabChange, disabled }) => (
    <div ref={controlRef} className={clsx(styles.controlsContainer, 'flex-1')}>
      <div className={styles.controls}>
        <div ref={tokensRef} className={clsx(styles.segment, activeTab === 'tokens' ? styles.active : styles.inactive)}>
          <input
            type="radio"
            value="tokens"
            id="tokens-tab"
            name="assets-bar-control"
            onChange={() => onTabChange('tokens')}
            checked={activeTab === 'tokens'}
            disabled={disabled}
          />
          <label htmlFor="tokens-tab">Tokens</label>
        </div>
        <div
          ref={nftsRef}
          className={clsx(styles.segment, activeTab === 'collectibles' ? styles.active : styles.inactive)}
        >
          <input
            type="radio"
            value="collectibles"
            id="nfts-tab"
            name="assets-bar-control"
            onChange={() => onTabChange('collectibles')}
            checked={activeTab === 'collectibles'}
            disabled={disabled}
          />
          <label htmlFor="nfts-tab">NFTs</label>
        </div>
      </div>
    </div>
  )
);

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
