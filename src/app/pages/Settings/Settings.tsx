import React, { FC, useMemo } from 'react';

import classNames from 'clsx';

import { ReactComponent as AppsIcon } from 'app/icons/apps.svg';
import { ReactComponent as ContactBookIcon } from 'app/icons/contact-book.svg';
import { ReactComponent as ExtensionIcon } from 'app/icons/extension.svg';
import { ReactComponent as HelpIcon } from 'app/icons/help.svg';
import { ReactComponent as KeyIcon } from 'app/icons/key.svg';
import { ReactComponent as MinusIcon } from 'app/icons/minus.svg';
import { ReactComponent as OkIcon } from 'app/icons/ok.svg';
import { ReactComponent as SettingsIcon } from 'app/icons/settings.svg';
import { ReactComponent as SignalAltIcon } from 'app/icons/signal-alt.svg';
import { ReactComponent as StickerIcon } from 'app/icons/sticker.svg';
import { ReactComponent as SyncIcon } from 'app/icons/sync.svg';
import PageLayout from 'app/layouts/PageLayout';
import About from 'app/templates/About/About';
import ActivateAccount from 'app/templates/ActivateAccount/ActivateAccount';
import AddressBook from 'app/templates/AddressBook/AddressBook';
import DAppSettings from 'app/templates/DAppSettings/DAppSettings';
import HelpAndCommunity from 'app/templates/HelpAndCommunity';
import RemoveAccount from 'app/templates/RemoveAccount/RemoveAccount';
import { RevealSeedPhrase, RevealPrivateKeys } from 'app/templates/RevealSecrets';
import GeneralSettings from 'app/templates/SettingsGeneral';
import SyncSettings from 'app/templates/Synchronization/SyncSettings';
import { TID, T } from 'lib/i18n';
import { Link } from 'lib/woozie';

import NetworksSettings from './Networks';
import { SettingsSelectors } from './Settings.selectors';

type SettingsProps = {
  tabSlug?: string | null;
};

interface Tab {
  slug: string;
  titleI18nKey: TID;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  Component: React.FC;
  color: string;
  descriptionI18nKey: TID;
  testID?: SettingsSelectors;
}

const TABS: Tab[] = [
  {
    slug: 'general-settings',
    titleI18nKey: 'generalSettings',
    Icon: SettingsIcon,
    Component: GeneralSettings,
    color: '#667EEA',
    descriptionI18nKey: 'generalSettingsDescription',
    testID: SettingsSelectors.generalButton
  },
  {
    slug: 'synchronization',
    titleI18nKey: 'synchronization',
    Icon: SyncIcon,
    Component: SyncSettings,
    color: '#7ED9A7',
    descriptionI18nKey: 'synchronizationSettingsDescription',
    testID: SettingsSelectors.synchronizationButton
  },
  {
    slug: 'address-book',
    titleI18nKey: 'addressBook',
    Icon: ContactBookIcon,
    Component: AddressBook,
    color: '#d53f8c',
    descriptionI18nKey: 'addressBookDescription',
    testID: SettingsSelectors.addressBookButton
  },
  {
    slug: 'reveal-private-key',
    titleI18nKey: 'revealPrivateKey',
    Icon: KeyIcon,
    Component: RevealPrivateKeys,
    color: '#3182CE',
    descriptionI18nKey: 'revealPrivateKeyDescription',
    testID: SettingsSelectors.revealPrivateKeyButton
  },
  {
    slug: 'reveal-seed-phrase',
    titleI18nKey: 'revealSeedPhrase',
    Icon: StickerIcon,
    Component: RevealSeedPhrase,
    color: '#F6AD55',
    descriptionI18nKey: 'revealSeedPhraseDescription',
    testID: SettingsSelectors.revealSeedPhraseButton
  },
  {
    slug: 'dapps',
    titleI18nKey: 'authorizedDApps',
    Icon: AppsIcon,
    Component: DAppSettings,
    color: '#9F7AEA',
    descriptionI18nKey: 'dAppsDescription',
    testID: SettingsSelectors.dAppsButton
  },
  {
    slug: 'networks',
    titleI18nKey: 'networks',
    Icon: SignalAltIcon,
    Component: NetworksSettings,
    color: '#F6C90E',
    descriptionI18nKey: 'networksDescription',
    testID: SettingsSelectors.networksButton
  },
  {
    slug: 'activate-account',
    titleI18nKey: 'activateAccount',
    Icon: OkIcon,
    Component: ActivateAccount,
    color: 'rgb(131, 179, 0)',
    descriptionI18nKey: 'activateAccountDescription',
    testID: SettingsSelectors.activateAccountButton
  },
  {
    slug: 'remove-account',
    titleI18nKey: 'removeAccount',
    Icon: MinusIcon,
    Component: RemoveAccount,
    color: 'rgb(245, 101, 101)',
    descriptionI18nKey: 'removeAccountDescription',
    testID: SettingsSelectors.removeAccountButton
  },
  {
    slug: 'about',
    titleI18nKey: 'about',
    Icon: ExtensionIcon,
    Component: About,
    color: '#A0AEC0',
    descriptionI18nKey: 'aboutDescription',
    testID: SettingsSelectors.aboutButton
  },
  {
    slug: 'help-and-community',
    titleI18nKey: 'helpAndCommunity',
    Icon: HelpIcon,
    Component: HelpAndCommunity,
    color: '#38B2AC',
    descriptionI18nKey: 'helpAndCommunityDescription'
  }
];

const Settings: FC<SettingsProps> = ({ tabSlug }) => {
  const activeTab = useMemo(() => TABS.find(t => t.slug === tabSlug) || null, [tabSlug]);

  return (
    <PageLayout
      pageTitle={
        <>
          <SettingsIcon className="mr-1 h-4 w-auto stroke-current" />
          <T id="settings" />
        </>
      }
    >
      <div className="py-4">
        {activeTab && (
          <>
            <h1
              className={classNames(
                'mb-2',
                'flex items-center justify-center',
                'text-2xl font-light text-gray-700 text-center'
              )}
            >
              {(() => {
                const { Icon, color, titleI18nKey } = activeTab;
                return (
                  <T id={titleI18nKey}>
                    {message => (
                      <>
                        <Icon className="mr-2 h-8 w-auto stroke-current" style={{ stroke: color }} />
                        {message}
                      </>
                    )}
                  </T>
                );
              })()}
            </h1>

            <hr className="mb-6" />
          </>
        )}

        <div>
          {activeTab ? (
            <activeTab.Component />
          ) : (
            <ul className="md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              {TABS.map(({ slug, titleI18nKey, descriptionI18nKey, Icon, color, testID }, i) => {
                const first = i === 0;
                const linkTo = `/settings/${slug}`;

                return (
                  <Link to={linkTo} key={slug} className={classNames(!first && 'mt-10 md:mt-0 block')} testID={testID}>
                    <div className="flex">
                      <div className="ml-2 flex-shrink-0">
                        <div
                          className={classNames(
                            'block',
                            'h-12 w-12',
                            'border-2 border-white border-opacity-25',
                            'rounded-full',
                            'flex items-center justify-center',
                            'text-white',
                            'transition ease-in-out duration-200',
                            'opacity-90 hover:opacity-100 focus:opacity-100'
                          )}
                          style={{ backgroundColor: color }}
                        >
                          <Icon className="h-8 w-8 stroke-current" />
                        </div>
                      </div>

                      <div className="ml-4">
                        <T id={titleI18nKey}>
                          {message => (
                            <div
                              className={classNames(
                                'text-lg leading-6 font-medium',
                                'filter-brightness-75',
                                'hover:underline focus:underline',
                                'transition ease-in-out duration-200'
                              )}
                              style={{ color }}
                            >
                              {message}
                            </div>
                          )}
                        </T>

                        <T id={descriptionI18nKey}>
                          {message => <p className="mt-1 text-sm font-light leading-5 text-gray-600">{message}</p>}
                        </T>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
