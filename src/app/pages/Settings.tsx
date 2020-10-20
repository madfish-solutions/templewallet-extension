import classNames from "clsx";
import * as React from "react";
import { Link } from "lib/woozie";
import { T } from "lib/i18n/react";
import About from "app/templates/About";
import ActivateAccount from "app/templates/ActivateAccount";
import { ReactComponent as AppsIcon } from "app/icons/apps.svg";
import CustomNetworksSettings from "app/templates/CustomNetworksSettings";
import DAppSettings from "app/templates/DAppSettings";
import { ReactComponent as ExtensionIcon } from "app/icons/extension.svg";
import { ReactComponent as KeyIcon } from "app/icons/key.svg";
import { ReactComponent as MinusIcon } from "app/icons/minus.svg";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";
import PageLayout from "app/layouts/PageLayout";
import GeneralSettings from "app/templates/GeneralSettings";
import RemoveAccount from "app/templates/RemoveAccount";
import RevealSecret from "app/templates/RevealSecret";
import { ReactComponent as SettingsIcon } from "app/icons/settings.svg";
import { ReactComponent as SignalAltIcon } from "app/icons/signal-alt.svg";
import { ReactComponent as StickerIcon } from "app/icons/sticker.svg";

type SettingsProps = {
  tabSlug?: string | null;
};

const RevealPrivateKey: React.FC = () => <RevealSecret reveal="private-key" />;
const RevealSeedPhrase: React.FC = () => <RevealSecret reveal="seed-phrase" />;

const TABS = [
  {
    slug: "general-settings",
    titleI18nKey: "generalSettings",
    Icon: SettingsIcon,
    Component: GeneralSettings,
    color: "#667EEA",
    descriptionI18nKey: "generalSettingsDescription",
  },
  {
    slug: "reveal-private-key",
    titleI18nKey: "revealPrivateKey",
    Icon: KeyIcon,
    Component: RevealPrivateKey,
    color: "#3182CE",
    descriptionI18nKey: "revealPrivateKeyDescription",
  },
  {
    slug: "reveal-seed-phrase",
    titleI18nKey: "revealSeedPhrase",
    Icon: StickerIcon,
    Component: RevealSeedPhrase,
    color: "#F6AD55",
    descriptionI18nKey: "revealSeedPhraseDescription",
  },
  {
    slug: "dapps",
    titleI18nKey: "dApps",
    Icon: AppsIcon,
    Component: DAppSettings,
    color: "#9F7AEA",
    descriptionI18nKey: "dAppsDescription",
  },
  {
    slug: "networks",
    titleI18nKey: "networks",
    Icon: SignalAltIcon,
    Component: CustomNetworksSettings,
    color: "#F6C90E",
    descriptionI18nKey: "networksDescription",
  },
  {
    slug: "activate-account",
    titleI18nKey: "activateAccount",
    Icon: OkIcon,
    Component: ActivateAccount,
    color: "rgb(131, 179, 0)",
    descriptionI18nKey: "activateAccountDescription",
  },
  {
    slug: "remove-account",
    titleI18nKey: "removeAccount",
    Icon: MinusIcon,
    Component: RemoveAccount,
    color: "rgb(245, 101, 101)",
    descriptionI18nKey: "removeAccountDescription",
  },
  {
    slug: "about",
    titleI18nKey: "about",
    Icon: ExtensionIcon,
    Component: About,
    color: "#A0AEC0",
    descriptionI18nKey: "aboutDescription",
  },
];

const Settings: React.FC<SettingsProps> = ({ tabSlug }) => {
  const activeTab = React.useMemo(
    () => TABS.find((t) => t.slug === tabSlug) || null,
    [tabSlug]
  );

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
                "mb-2",
                "flex items-center justify-center",
                "text-2xl font-light text-gray-700 text-center"
              )}
            >
              {(() => {
                const { Icon, color, titleI18nKey } = activeTab;
                return (
                  <T id={titleI18nKey}>
                    {(message) => (
                      <>
                        <Icon
                          className="mr-2 h-8 w-auto stroke-current"
                          style={{ stroke: color }}
                        />
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
            <ul className="md:grid md:grid-cols-2 md:col-gap-8 md:row-gap-10">
              {TABS.map(
                (
                  { slug, titleI18nKey, descriptionI18nKey, Icon, color },
                  i
                ) => {
                  const first = i === 0;
                  const linkTo = `/settings/${slug}`;

                  return (
                    <li
                      key={slug}
                      className={classNames(!first && "mt-10 md:mt-0")}
                    >
                      <div className="flex">
                        <div className="ml-2 flex-shrink-0">
                          <Link
                            to={linkTo}
                            className={classNames(
                              "block",
                              "h-12 w-12",
                              "border-2 border-white border-opacity-25",
                              "rounded-full",
                              "flex items-center justify-center",
                              "text-white",
                              "transition ease-in-out duration-200",
                              "opacity-90 hover:opacity-100 focus:opacity-100"
                            )}
                            style={{ backgroundColor: color }}
                          >
                            <Icon className="h-8 w-8 stroke-current" />
                          </Link>
                        </div>

                        <div className="ml-4">
                          <T id={titleI18nKey}>
                            {(message) => (
                              <Link
                                to={linkTo}
                                className={classNames(
                                  "text-lg leading-6 font-medium",
                                  "filter-brightness-75",
                                  "hover:underline focus:underline",
                                  "transition ease-in-out duration-200"
                                )}
                                style={{ color }}
                              >
                                {message}
                              </Link>
                            )}
                          </T>

                          <T id={descriptionI18nKey}>
                            {(message) => (
                              <p className="mt-1 text-sm font-light leading-5 text-gray-600">
                                {message}
                              </p>
                            )}
                          </T>
                        </div>
                      </div>
                    </li>
                  );
                }
              )}
            </ul>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
