import { memo, useCallback, useState } from 'react';

import clsx from 'clsx';

import { useAppEnv } from 'app/env';
import { ReactComponent as FlaskIcon } from 'app/icons/base/flask.svg';
import { ReactComponent as SidebarIcon } from 'app/icons/base/sidebar.svg';
import { IS_SIDE_PANEL_AVAILABLE } from 'lib/env';

import { MenuDropdownSelectors } from '../selectors';

import { ControlButton } from './ControlButton';
import { ControlFiltersButton } from './ControlFiltersButton';

type ToggleButtonKey = 'filters' | 'sidebar' | 'testnet';

interface Props {
  testnetModeEnabled: boolean;
  isSidebarEnabled: boolean;
  onFiltersClick: EmptyFn;
  onSidebarClick: EmptyFn;
  onTestnetClick: EmptyFn;
}

export const ControlsSection = memo<Props>(
  ({ testnetModeEnabled, isSidebarEnabled, onFiltersClick, onSidebarClick, onTestnetClick }) => {
    const { fullPage } = useAppEnv();

    const [expandedButton, setExpandedButton] = useState<ToggleButtonKey>('filters');

    const expandFilters = useCallback(() => setExpandedButton('filters'), []);
    const expandSidebar = useCallback(() => setExpandedButton('sidebar'), []);
    const expandTestnet = useCallback(() => setExpandedButton('testnet'), []);

    const showSidebarButton = !fullPage && IS_SIDE_PANEL_AVAILABLE;
    const stretch = !fullPage && !showSidebarButton;

    return (
      <div
        className={clsx(
          'flex items-center px-1 py-2',
          fullPage ? 'w-fit gap-x-2' : clsx('w-41', showSidebarButton ? 'gap-x-1' : 'gap-x-2')
        )}
      >
        <ControlFiltersButton
          expanded={fullPage || expandedButton === 'filters'}
          stretch={stretch}
          onClick={onFiltersClick}
          testID={MenuDropdownSelectors.filtersButton}
        />

        {showSidebarButton && (
          <ControlButton
            Icon={SidebarIcon}
            labelI18n="sidebar"
            active={isSidebarEnabled}
            expanded={expandedButton === 'sidebar'}
            onClick={onSidebarClick}
            onMouseEnter={expandSidebar}
            onMouseLeave={expandFilters}
            testID={MenuDropdownSelectors.sidebarButton}
          />
        )}

        <ControlButton
          Icon={FlaskIcon}
          labelI18n="testnet"
          active={testnetModeEnabled}
          expanded={fullPage || expandedButton === 'testnet'}
          stretch={stretch}
          onClick={onTestnetClick}
          onMouseEnter={expandTestnet}
          onMouseLeave={expandFilters}
          testID={MenuDropdownSelectors.testnetButton}
        />
      </div>
    );
  }
);
