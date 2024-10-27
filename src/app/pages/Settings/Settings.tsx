import React, { FC, ReactNode, SetStateAction, memo, useMemo, useState } from 'react';

import { IconBase } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import { SettingsCell } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as AdditionalFeaturesIcon } from 'app/icons/base/additional.svg';
import { ReactComponent as AddressBookIcon } from 'app/icons/base/addressbook.svg';
import { ReactComponent as BrowseIcon } from 'app/icons/base/browse.svg';
import { ReactComponent as ChevronRightIcon } from 'app/icons/base/chevron_right.svg';
import { ReactComponent as ExitIcon } from 'app/icons/base/exit.svg';
import { ReactComponent as InfoIcon } from 'app/icons/base/info.svg';
import { ReactComponent as LinkIcon } from 'app/icons/base/link.svg';
import { ReactComponent as LockIcon } from 'app/icons/base/lock.svg';
import { ReactComponent as ManageIcon } from 'app/icons/base/manage.svg';
import { ReactComponent as RefreshIcon } from 'app/icons/base/refresh.svg';
import PageLayout from 'app/layouts/PageLayout';
import About from 'app/templates/About/About';
import { AccountsManagement } from 'app/templates/AccountsManagement';
import AddressBook from 'app/templates/AddressBook/AddressBook';
import { AdvancedFeatures } from 'app/templates/AdvancedFeatures';
import DAppSettings from 'app/templates/DAppSettings/DAppSettings';
import { SecuritySettings } from 'app/templates/SecuritySettings';
import GeneralSettings from 'app/templates/SettingsGeneral';
import SyncSettings from 'app/templates/Synchronization/SyncSettings';
import { TID, T } from 'lib/i18n';
import { useBooleanState } from 'lib/ui/hooks';
import { Link } from 'lib/woozie';
import { useAccount } from 'temple/front';

import NetworksSettings from './Networks';
import { ResetExtensionModal } from './reset-extension-modal';
import { SettingsSelectors } from './Settings.selectors';

interface SettingsProps {
  tabSlug?: string | null;
}

interface Tab {
  slug: string;
  titleI18nKey: TID;
  Icon: FC;
  noPadding?: true;
  Component: FC<{ setHeaderChildren: React.Dispatch<SetStateAction<ReactNode>> }>;
  testID?: SettingsSelectors;
}

const DefaultSettingsIconHOC = (Icon: React.FC<React.SVGProps<SVGSVGElement>>) =>
  memo(() => <IconBase size={16} Icon={Icon} className="text-primary" />);

const TABS_GROUPS: Tab[][] = [
  [
    {
      slug: 'accounts-management',
      titleI18nKey: 'accountsManagement',
      Icon: memo(() => {
        const { id } = useAccount();

        return <AccountAvatar size={24} seed={id} />;
      }),
      noPadding: true,
      Component: AccountsManagement,
      testID: SettingsSelectors.accountsManagementButton
    }
  ],
  [
    {
      slug: 'general-settings',
      titleI18nKey: 'generalSettings',
      Icon: DefaultSettingsIconHOC(ManageIcon),
      Component: GeneralSettings,
      testID: SettingsSelectors.generalButton
    },
    {
      slug: 'networks',
      titleI18nKey: 'networks',
      Icon: DefaultSettingsIconHOC(BrowseIcon),
      Component: NetworksSettings,
      testID: SettingsSelectors.networksButton
    },
    {
      slug: 'security-and-privacy',
      titleI18nKey: 'securityAndPrivacy',
      Icon: DefaultSettingsIconHOC(LockIcon),
      Component: SecuritySettings,
      testID: SettingsSelectors.securityAndPrivacyButton
    }
  ],
  [
    {
      slug: 'address-book',
      titleI18nKey: 'addressBook',
      Icon: DefaultSettingsIconHOC(AddressBookIcon),
      Component: AddressBook,
      testID: SettingsSelectors.addressBookButton
    },
    {
      slug: 'dapps',
      titleI18nKey: 'connectedDApps',
      Icon: DefaultSettingsIconHOC(LinkIcon),
      Component: DAppSettings,
      testID: SettingsSelectors.dAppsButton
    },
    {
      slug: 'additional-settings',
      titleI18nKey: 'advancedFeatures',
      Icon: DefaultSettingsIconHOC(AdditionalFeaturesIcon),
      Component: AdvancedFeatures,
      testID: SettingsSelectors.advancedFeaturesButton
    },
    {
      slug: 'synchronization',
      titleI18nKey: 'templeSync',
      Icon: DefaultSettingsIconHOC(RefreshIcon),
      Component: SyncSettings,
      testID: SettingsSelectors.synchronizationButton
    }
  ],
  [
    {
      slug: 'about',
      titleI18nKey: 'aboutAndSupport',
      Icon: DefaultSettingsIconHOC(InfoIcon),
      Component: About,
      testID: SettingsSelectors.aboutButton
    }
  ]
];

const TABS = TABS_GROUPS.flat();

const Settings = memo<SettingsProps>(({ tabSlug }) => {
  const activeTab = useMemo(() => TABS.find(t => t.slug === tabSlug) || null, [tabSlug]);
  const [headerChildren, setHeaderChildren] = useState<ReactNode>(null);
  const [extensionModalOpened, openResetExtensionModal, closeResetExtensionModal] = useBooleanState(false);

  return (
    <PageLayout
      pageTitle={<T id={activeTab?.titleI18nKey ?? 'settings'} />}
      dimBg
      headerChildren={headerChildren}
      contentPadding={!activeTab?.noPadding}
    >
      {extensionModalOpened && <ResetExtensionModal onClose={closeResetExtensionModal} />}

      {activeTab ? (
        <activeTab.Component setHeaderChildren={setHeaderChildren} />
      ) : (
        <div className="flex flex-col gap-4">
          {TABS_GROUPS.map((tabs, i) => (
            <SettingsCellGroup key={i}>
              {tabs.map(({ slug, titleI18nKey, Icon, testID }, j) => (
                <SettingsCell
                  Component={Link}
                  to={`/settings/${slug}`}
                  key={slug}
                  cellIcon={<Icon />}
                  cellName={<T id={titleI18nKey} />}
                  isLast={j === tabs.length - 1}
                  testID={testID}
                >
                  <IconBase size={16} Icon={ChevronRightIcon} className="text-primary" />
                </SettingsCell>
              ))}
            </SettingsCellGroup>
          ))}

          <div className="mt-2 flex justify-center">
            <StyledButton
              size="S"
              color="red-low"
              className="!bg-transparent flex items-center !px-0 py-1 gap-0.5"
              onClick={openResetExtensionModal}
              testID={SettingsSelectors.resetExtensionButton}
            >
              <T id="resetExtension" />

              <IconBase size={12} Icon={ExitIcon} />
            </StyledButton>
          </div>
        </div>
      )}
    </PageLayout>
  );
});

export default Settings;
