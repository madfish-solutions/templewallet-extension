import { memo, useCallback, useState } from 'react';

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
    const [expandedButton, setExpandedButton] = useState<ToggleButtonKey>('filters');

    const expandFilters = useCallback(() => setExpandedButton('filters'), []);
    const expandSidebar = useCallback(() => setExpandedButton('sidebar'), []);
    const expandTestnet = useCallback(() => setExpandedButton('testnet'), []);

    return (
      <div className="flex items-center w-[164px] px-1 py-2 gap-x-1">
        <ControlFiltersButton
          expanded={expandedButton === 'filters'}
          onClick={onFiltersClick}
          testID={MenuDropdownSelectors.filtersButton}
        />

        {IS_SIDE_PANEL_AVAILABLE && (
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
          expanded={expandedButton === 'testnet'}
          onClick={onTestnetClick}
          onMouseEnter={expandTestnet}
          onMouseLeave={expandFilters}
          testID={MenuDropdownSelectors.testnetButton}
        />
      </div>
    );
  }
);
