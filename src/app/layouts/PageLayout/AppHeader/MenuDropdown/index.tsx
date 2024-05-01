import React, { memo, useCallback, useMemo } from 'react';

import { Divider, ToggleSwitch } from 'app/atoms';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { openInFullPage, useAppEnv } from 'app/env';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as DAppsIcon } from 'app/icons/apps-alt.svg';
import { ReactComponent as LockIcon } from 'app/icons/lock.svg';
import { ReactComponent as MaximiseIcon } from 'app/icons/maximise.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import { NotificationsBell } from 'lib/notifications/components/bell';
import { useTempleClient } from 'lib/temple/front';
import { PopperRenderProps } from 'lib/ui/Popper';

import { ActionButtonProps, ActionButton } from './ActionButton';
import { MenuDropdownSelectors } from './selectors';

interface TDropdownAction extends ActionButtonProps {
  key: string;
}

const MenuDropdown = memo<PopperRenderProps>(({ opened, setOpened }) => {
  const appEnv = useAppEnv();
  const { lock } = useTempleClient();

  useShortcutAccountSelectModalIsOpened(() => setOpened(false));

  const closeDropdown = useCallback(() => {
    setOpened(false);
  }, [setOpened]);

  const handleLogoutClick = useCallback(() => {
    lock();
  }, [lock]);

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
        i18nKey: 'dApps',
        linkTo: '/dApps',
        testID: MenuDropdownSelectors.dAppsButton,
        onClick: closeDropdown
      },
      {
        key: 'settings',
        Icon: SettingsIcon,
        i18nKey: 'settings',
        linkTo: '/settings',
        testID: MenuDropdownSelectors.settingsButton,
        onClick: closeDropdown
      },
      {
        key: 'notifications',
        Icon: NotificationsBell,
        i18nKey: 'notifications',
        linkTo: '/notifications',
        testID: MenuDropdownSelectors.notificationsButton,
        onClick: closeDropdown
      },
      {
        key: 'maximize',
        Icon: MaximiseIcon,
        i18nKey: appEnv.fullPage ? 'openNewTab' : 'maximiseView',
        linkTo: null,
        testID: appEnv.fullPage ? MenuDropdownSelectors.newTabButton : MenuDropdownSelectors.maximizeButton,
        onClick: handleMaximiseViewClick
      },
      {
        key: 'lock',
        Icon: LockIcon,
        i18nKey: 'lock',
        linkTo: null,
        testID: MenuDropdownSelectors.logoutButton,
        onClick: handleLogoutClick
      }
    ],
    [appEnv.fullPage, closeDropdown, handleMaximiseViewClick, handleLogoutClick]
  );

  return (
    <DropdownWrapper opened={opened} design="day" className="p-2 flex flex-col" style={{ minWidth: 163 }}>
      <h6 className="py-2.5 px-2 text-xxxs leading-3 font-semibold text-grey-1">Menu</h6>

      {actions.map(action => (
        <ActionButton {...action} />
      ))}

      <Divider className="my-1.5" />

      <label className="py-2.5 px-2 flex items-center gap-x-1">
        <span className="flex-1 text-xs">Testnet Mode</span>

        <ToggleSwitch small checked={false} />
      </label>
    </DropdownWrapper>
  );
});

export default MenuDropdown;
