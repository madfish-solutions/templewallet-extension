import React, { memo, useCallback, useMemo } from 'react';

import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { openInFullPage, useAppEnv } from 'app/env';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as DAppsIcon } from 'app/icons/apps-alt.svg';
import { ReactComponent as LockIcon } from 'app/icons/lock.svg';
import { ReactComponent as MaximiseIcon } from 'app/icons/maximise.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import { useTempleClient } from 'lib/temple/front';
import { PopperRenderProps } from 'lib/ui/Popper';

import { ActionButtonProps, ActionButton } from './ActionButton';
import { AccountDropdownSelectors } from './selectors';

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
        testID: AccountDropdownSelectors.dAppsButton,
        onClick: closeDropdown
      },
      {
        key: 'settings',
        Icon: SettingsIcon,
        i18nKey: 'settings',
        linkTo: '/settings',
        testID: AccountDropdownSelectors.settingsButton,
        onClick: closeDropdown
      },
      {
        key: 'maximize',
        Icon: MaximiseIcon,
        i18nKey: appEnv.fullPage ? 'openNewTab' : 'maximiseView',
        linkTo: null,
        testID: appEnv.fullPage ? AccountDropdownSelectors.newTabButton : AccountDropdownSelectors.maximizeButton,
        onClick: handleMaximiseViewClick
      },
      {
        key: 'lock',
        Icon: LockIcon,
        i18nKey: 'lock',
        linkTo: null,
        testID: AccountDropdownSelectors.logoutButton,
        onClick: handleLogoutClick
      }
    ],
    [appEnv.fullPage, closeDropdown, handleMaximiseViewClick, handleLogoutClick]
  );

  return (
    <DropdownWrapper opened={opened} design="day" className="p-2 flex flex-col" style={{ minWidth: 163 }}>
      <h6 className="py-2.5 px-2 text-xxxs leading-3 font-semibold text-gray-550">Menu</h6>

      {actions.map(action => (
        <ActionButton {...action} />
      ))}
    </DropdownWrapper>
  );
});

export default MenuDropdown;
