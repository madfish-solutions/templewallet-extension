import React, { memo, useCallback, useMemo } from 'react';

import { Divider, ToggleSwitch } from 'app/atoms';
import { ActionListItem, ActionListItemProps } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { openInFullPage, useAppEnv } from 'app/env';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as FullViewIcon } from 'app/icons/base/fullview.svg';
import { ReactComponent as LockIcon } from 'app/icons/base/lock.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/base/settings.svg';
import { ReactComponent as DAppsIcon } from 'app/icons/monochrome/apps-alt.svg';
import { T } from 'lib/i18n';
import { NotificationsBell } from 'lib/notifications/components/bell';
import { useTempleClient } from 'lib/temple/front';
import { PopperRenderProps } from 'lib/ui/Popper';

import { MenuDropdownSelectors } from './selectors';

interface TDropdownAction extends ActionListItemProps {
  key: string;
}

const MenuDropdown = memo<PopperRenderProps>(({ opened, setOpened }) => {
  const appEnv = useAppEnv();
  const { lock } = useTempleClient();

  const closeDropdown = useCallback(() => void setOpened(false), [setOpened]);

  useShortcutAccountSelectModalIsOpened(closeDropdown);

  const handleMaximiseViewClick = useCallback(() => {
    openInFullPage();
    if (appEnv.popup) {
      window.close();
    } else {
      closeDropdown();
    }
  }, [appEnv.popup, closeDropdown]);

  const actions = useMemo(
    (): TDropdownAction[] => [
      {
        key: 'dapps',
        Icon: DAppsIcon,
        children: <T id="dApps" />,
        linkTo: '/dApps',
        testID: MenuDropdownSelectors.dAppsButton,
        onClick: closeDropdown
      },
      {
        key: 'settings',
        Icon: SettingsIcon,
        children: <T id="settings" />,
        linkTo: '/settings',
        testID: MenuDropdownSelectors.settingsButton,
        onClick: closeDropdown
      },
      {
        key: 'notifications',
        Icon: NotificationsBell,
        children: <T id="notifications" />,
        linkTo: '/notifications',
        testID: MenuDropdownSelectors.notificationsButton,
        onClick: closeDropdown
      },
      {
        key: 'maximize',
        Icon: FullViewIcon,
        children: <T id={appEnv.fullPage ? 'openNewTab' : 'maximiseView'} />,
        testID: appEnv.fullPage ? MenuDropdownSelectors.newTabButton : MenuDropdownSelectors.maximizeButton,
        onClick: handleMaximiseViewClick
      },
      {
        key: 'lock',
        Icon: LockIcon,
        children: <T id="lock" />,
        testID: MenuDropdownSelectors.logoutButton,
        onClick: lock
      }
    ],
    [appEnv.fullPage, closeDropdown, handleMaximiseViewClick, lock]
  );

  return (
    <ActionsDropdownPopup title="Menu" opened={opened} lowering={3} style={{ minWidth: 163 }}>
      {actions.map(action => (
        <ActionListItem {...action} key={action.key} />
      ))}

      <Divider className="my-1.5" />

      <label className="py-2.5 px-2 flex items-center gap-x-1">
        <span className="flex-1 text-font-description">Testnet Mode</span>

        <ToggleSwitch small checked={false} />
      </label>
    </ActionsDropdownPopup>
  );
});

export default MenuDropdown;
