import React, { memo, useCallback, useMemo, useState } from 'react';

import { isEqual } from 'lodash';

import { Divider } from 'app/atoms';
import { ActionListItem, ActionListItemProps } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { PageModal } from 'app/atoms/PageModal';
import {
  getIsSidebarByDefault,
  openInFullPage,
  openInSidebar,
  openPopup,
  setIsSidebarByDefault,
  useAppEnv
} from 'app/env';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as ExploreIcon } from 'app/icons/base/explore.svg';
import { ReactComponent as FilterOffIcon } from 'app/icons/base/filteroff.svg';
import { ReactComponent as FilterOnIcon } from 'app/icons/base/filteron.svg';
import { ReactComponent as FlaskIcon } from 'app/icons/base/flask.svg';
import { ReactComponent as FullViewIcon } from 'app/icons/base/fullview.svg';
import { ReactComponent as LinkIcon } from 'app/icons/base/link.svg';
import { ReactComponent as LockIcon } from 'app/icons/base/lock.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/base/settings.svg';
import { ReactComponent as SidebarIcon } from 'app/icons/base/sidebar.svg';
import { NotificationsBell } from 'app/pages/Notifications/components/bell';
import { RewardsIconWithBadge } from 'app/pages/Notifications/components/rewards';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { useAssetsFilterOptionsSelector } from 'app/store/assets-filter-options/selectors';
import { AssetsFilterOptionsInitialState } from 'app/store/assets-filter-options/state';
import { setIsTestnetModeEnabledAction } from 'app/store/settings/actions';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { IS_SIDE_PANEL_AVAILABLE } from 'lib/env';
import { T } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { PopperRenderProps } from 'lib/ui/Popper';
import { useAccount } from 'temple/front';

import { ToggleButton } from './components/ToggleButton';
import { MenuDropdownSelectors } from './selectors';

interface TDropdownAction extends ActionListItemProps {
  key: string;
}

type ToggleButtonKey = 'filters' | 'sidebar' | 'testnet';

const MenuDropdown = memo<PopperRenderProps>(({ opened, setOpened }) => {
  const { fullPage, sidebar } = useAppEnv();
  const { lock } = useTempleClient();
  const account = useAccount();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const assetsFilterOptions = useAssetsFilterOptionsSelector();
  const { data: isSidebarByDefault } = useTypedSWR('is-sidebar-by-default', getIsSidebarByDefault, {
    fallbackData: sidebar
  });
  const [filtersModalOpened, openFiltersModal, closeFiltersModal] = useBooleanState(false);
  const [expandedButton, setExpandedButton] = useState<ToggleButtonKey>('filters');

  const closeDropdown = useCallback(() => void setOpened(false), [setOpened]);

  const handleTestnetModeSwitch = useCallback((value: boolean) => {
    dispatch(setAssetsFilterChain(null));
    dispatch(setIsTestnetModeEnabledAction(value));
  }, []);

  useShortcutAccountSelectModalIsOpened(closeDropdown);

  const handleMaximiseViewClick = useCallback(() => {
    openInFullPage();
    if (fullPage) {
      closeDropdown();
    } else {
      window.close();
    }
  }, [fullPage, closeDropdown]);

  const handleSidebarSwitch = useCallback(async (checked: boolean) => {
    try {
      await setIsSidebarByDefault(checked);
      if (checked) {
        await openInSidebar();
      } else {
        openPopup();
      }
      window.close();
    } catch (e) {
      console.error('Failed to open in sidebar:', e);
    }
  }, []);

  const handleFiltersClick = useCallback(() => {
    closeDropdown();
    openFiltersModal();
  }, [closeDropdown, openFiltersModal]);

  const handleSidebarButtonClick = useCallback(() => {
    closeDropdown();
    void handleSidebarSwitch(!isSidebarByDefault);
  }, [closeDropdown, handleSidebarSwitch, isSidebarByDefault]);

  const handleTestnetButtonClick = useCallback(() => {
    closeDropdown();
    handleTestnetModeSwitch(!testnetModeEnabled);
  }, [closeDropdown, handleTestnetModeSwitch, testnetModeEnabled]);

  const isNonDefaultFilterOption = useMemo(
    () => !isEqual(assetsFilterOptions, AssetsFilterOptionsInitialState),
    [assetsFilterOptions]
  );

  const openExpandedFiltersButton = useCallback(() => setExpandedButton('filters'), []);
  const openExpandedSidebarButton = useCallback(() => setExpandedButton('sidebar'), []);
  const openExpandedTestnetButton = useCallback(() => setExpandedButton('testnet'), []);

  const actions = useMemo(
    (): TDropdownAction[] => [
      {
        key: 'settings',
        Icon: SettingsIcon,
        children: <T id="settings" />,
        linkTo: '/settings',
        testID: MenuDropdownSelectors.settingsButton,
        onClick: closeDropdown,
        withDividerAfter: true
      },
      {
        key: 'rewards',
        Icon: RewardsIconWithBadge,
        children: <T id="rewards" />,
        linkTo: '/rewards',
        testID: MenuDropdownSelectors.rewardsButton,
        onClick: closeDropdown,
        disabled: account.type === TempleAccountType.WatchOnly
      },
      {
        key: 'notifications',
        Icon: NotificationsBell,
        children: <T id="notifications" />,
        linkTo: '/notifications',
        testID: MenuDropdownSelectors.notificationsButton,
        onClick: closeDropdown,
        withDividerAfter: true
      },
      {
        key: 'dapps',
        Icon: ExploreIcon,
        children: <T id="dApps" />,
        linkTo: '/dapps',
        testID: MenuDropdownSelectors.dappsButton,
        onClick: closeDropdown
      },
      {
        key: 'connections',
        Icon: LinkIcon,
        children: <T id="connections" />,
        linkTo: '/settings/dapps',
        testID: MenuDropdownSelectors.connectedDAppsButton,
        onClick: closeDropdown
      },
      {
        key: 'maximize',
        Icon: FullViewIcon,
        children: <T id={fullPage ? 'openNewTab' : 'maximiseView'} />,
        testID: fullPage ? MenuDropdownSelectors.newTabButton : MenuDropdownSelectors.maximizeButton,
        onClick: handleMaximiseViewClick
      },
      {
        key: 'lock',
        Icon: LockIcon,
        children: <T id="lockWallet" />,
        testID: MenuDropdownSelectors.logoutButton,
        onClick: lock
      }
    ],
    [closeDropdown, account.type, fullPage, handleMaximiseViewClick, lock]
  );

  return (
    <>
      <ActionsDropdownPopup title="Menu" opened={opened} lowering={3} style={{ minWidth: 163 }}>
        {actions.map(action => {
          const { key, ...rest } = action;

          return (
            <div key={key}>
              <ActionListItem {...rest} />
              {action.withDividerAfter && <Divider className="bg-grey-4 px-2" />}
            </div>
          );
        })}

        <Divider className="my-1.5 bg-grey-4 px-1.5" />

        <div className="px-1 py-1 flex items-center gap-1.5">
          <ToggleButton
            Icon={isNonDefaultFilterOption ? FilterOnIcon : FilterOffIcon}
            labelI18n="filters"
            highlighted={false}
            expanded={expandedButton === 'filters'}
            onClick={handleFiltersClick}
            testID={MenuDropdownSelectors.filtersButton}
          />

          {!fullPage && IS_SIDE_PANEL_AVAILABLE && (
            <ToggleButton
              Icon={SidebarIcon}
              labelI18n="sidebar"
              highlighted
              expanded={expandedButton === 'sidebar'}
              onClick={handleSidebarButtonClick}
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
            onClick={handleTestnetButtonClick}
            onMouseEnter={openExpandedTestnetButton}
            onMouseLeave={openExpandedFiltersButton}
            testID={MenuDropdownSelectors.testnetButton}
          />
        </div>
      </ActionsDropdownPopup>

      <PageModal title="Filters" opened={filtersModalOpened} onRequestClose={closeFiltersModal}>
        <div className="p-4 overflow-y-auto">
          <AssetsFilterOptions />
        </div>
      </PageModal>
    </>
  );
});

export default MenuDropdown;
