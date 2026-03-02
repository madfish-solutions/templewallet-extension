import { memo, useCallback, useState } from 'react';

import { useAppEnv } from 'app/env';
import { ReactComponent as FlaskIcon } from 'app/icons/base/flask.svg';
import { ReactComponent as SidebarIcon } from 'app/icons/base/sidebar.svg';
import { IS_SIDE_PANEL_AVAILABLE } from 'lib/env';

import { MenuDropdownSelectors } from '../selectors';

import { FiltersToggleButton } from './FiltersToggleButton';
import { ToggleButton } from './ToggleButton';

type ToggleButtonKey = 'filters' | 'sidebar' | 'testnet';

interface Props {
  onFiltersClick: EmptyFn;
  onSidebarClick: EmptyFn;
  onTestnetClick: EmptyFn;
}

export const TogglesSection = memo<Props>(({ onFiltersClick, onSidebarClick, onTestnetClick }) => {
  const { fullPage } = useAppEnv();

  const [expandedButton, setExpandedButton] = useState<ToggleButtonKey>('filters');

  const openExpandedFiltersButton = useCallback(() => setExpandedButton('filters'), []);
  const openExpandedSidebarButton = useCallback(() => setExpandedButton('sidebar'), []);
  const openExpandedTestnetButton = useCallback(() => setExpandedButton('testnet'), []);

  const showSidebarButton = !fullPage && IS_SIDE_PANEL_AVAILABLE;

  return (
    <div className="px-1 py-1 flex items-center gap-1.5">
      <FiltersToggleButton
        expanded={expandedButton === 'filters'}
        onClick={onFiltersClick}
        testID={MenuDropdownSelectors.filtersButton}
      />

      {showSidebarButton && (
        <ToggleButton
          Icon={SidebarIcon}
          labelI18n="sidebar"
          highlighted
          expanded={expandedButton === 'sidebar'}
          onClick={onSidebarClick}
          onMouseEnter={openExpandedSidebarButton}
          onMouseLeave={openExpandedFiltersButton}
          testID={MenuDropdownSelectors.sidebarButton}
        />
      )}

      <ToggleButton
        Icon={FlaskIcon}
        labelI18n="testnet"
        highlighted
        expanded={expandedButton === 'testnet'}
        onClick={onTestnetClick}
        onMouseEnter={openExpandedTestnetButton}
        onMouseLeave={openExpandedFiltersButton}
        testID={MenuDropdownSelectors.testnetButton}
      />
    </div>
  );
});
