import { memo, useCallback, useMemo } from 'react';

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
import { ReactComponent as FullViewIcon } from 'app/icons/base/fullview.svg';
import { ReactComponent as LinkIcon } from 'app/icons/base/link.svg';
import { ReactComponent as LockIcon } from 'app/icons/base/lock.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/base/settings.svg';
import { NotificationsBell } from 'app/pages/Notifications/components/bell';
import { RewardsIconWithBadge } from 'app/pages/Notifications/components/rewards';
import { dispatch } from 'app/store';
import { setAssetsFilterChain } from 'app/store/assets-filter-options/actions';
import { setIsTestnetModeEnabledAction } from 'app/store/settings/actions';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AssetsFilterOptions } from 'app/templates/AssetsFilterOptions';
import { T, t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';
import { useBooleanState } from 'lib/ui/hooks';
import { PopperRenderProps } from 'lib/ui/Popper';
import { useAccount } from 'temple/front';

import { ControlsSection } from './components/ControlsSection';
import { MenuDropdownSelectors } from './selectors';

interface TDropdownAction extends ActionListItemProps {
  key: string;
}

const MenuDropdown = memo<PopperRenderProps>(({ opened, setOpened }) => {
  const { fullPage, sidebar } = useAppEnv();
  const { lock } = useTempleClient();
  const account = useAccount();

  const [filtersModalOpened, openFiltersModal, closeFiltersModal] = useBooleanState(false);

  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const { data: isSidebarByDefault } = useTypedSWR('is-sidebar-by-default', getIsSidebarByDefault, {
    fallbackData: sidebar
  });

  const closeDropdown = useCallback(() => void setOpened(false), [setOpened]);

  useShortcutAccountSelectModalIsOpened(closeDropdown);

  const handleMaximiseViewClick = useCallback(() => {
    openInFullPage();
    if (fullPage) {
      closeDropdown();
    } else {
      window.close();
    }
  }, [fullPage, closeDropdown]);

  const onFiltersClick = useCallback(() => {
    closeDropdown();
    openFiltersModal();
  }, [closeDropdown, openFiltersModal]);

  const onSidebarClick = useCallback(async () => {
    try {
      const isSidebarEnabled = !isSidebarByDefault;

      await setIsSidebarByDefault(isSidebarEnabled);

      if (isSidebarEnabled) {
        await openInSidebar();
      } else {
        openPopup();
      }

      window.close();
    } catch (e) {
      console.error('Failed to open in sidebar:', e);
    }
  }, [isSidebarByDefault]);

  const onTestnetClick = useCallback(() => {
    dispatch(setAssetsFilterChain(null));
    dispatch(setIsTestnetModeEnabledAction(!testnetModeEnabled));
  }, [testnetModeEnabled]);

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

        <ControlsSection
          testnetModeEnabled={testnetModeEnabled}
          isSidebarEnabled={Boolean(isSidebarByDefault)}
          onFiltersClick={onFiltersClick}
          onSidebarClick={onSidebarClick}
          onTestnetClick={onTestnetClick}
        />
      </ActionsDropdownPopup>

      <PageModal title={t('filters')} opened={filtersModalOpened} onRequestClose={closeFiltersModal}>
        <AssetsFilterOptions />
      </PageModal>
    </>
  );
});

export default MenuDropdown;
