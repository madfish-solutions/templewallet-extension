import React, { memo, useCallback, useMemo } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms/Button';
import DropdownWrapper from 'app/atoms/DropdownWrapper';
import { openInFullPage, useAppEnv } from 'app/env';
import { useShortcutAccountSelectModalIsOpened } from 'app/hooks/use-account-select-shortcut';
import { ReactComponent as DAppsIcon } from 'app/icons/apps-alt.svg';
import { ReactComponent as LockIcon } from 'app/icons/lock.svg';
import { ReactComponent as MaximiseIcon } from 'app/icons/maximise.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import { T } from 'lib/i18n';
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
      }
    ],
    [appEnv.fullPage, closeDropdown, handleMaximiseViewClick]
  );

  return (
    <DropdownWrapper opened={opened} design="dark" className="p-2 w-64">
      <div className="flex items-center mb-2">
        <h3 className="flex items-center text-sm text-white opacity-20">Menu</h3>

        <div className="flex-1" />

        <Button
          className={clsx(
            'px-2 py-0.5',
            'rounded-md',
            'border border-gray-200',
            'flex items-center',
            'text-gray-200',
            'text-sm',
            'transition duration-300 ease-in-out',
            'opacity-20',
            'hover:opacity-100'
          )}
          onClick={handleLogoutClick}
          testID={AccountDropdownSelectors.logoutButton}
        >
          <LockIcon className="mr-1 h-4 w-auto" />
          <T id="lock" />
        </Button>
      </div>

      <div className="mt-2">
        {actions.map(action => (
          <ActionButton {...action} />
        ))}
      </div>
    </DropdownWrapper>
  );
});

export default MenuDropdown;
