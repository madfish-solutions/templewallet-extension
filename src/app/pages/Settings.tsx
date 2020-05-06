import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import PageLayout from "app/layouts/PageLayout";
import RevealSecret from "app/templates/RevealSecret";
import ActivateAccount from "app/templates/ActivateAccount";
import RemoveAccount from "app/templates/RemoveAccount";
import About from "app/templates/About";
import { ReactComponent as SettingsIcon } from "app/icons/settings.svg";
import { ReactComponent as KeyIcon } from "app/icons/key.svg";
import { ReactComponent as StickerIcon } from "app/icons/sticker.svg";
import { ReactComponent as OkIcon } from "app/icons/ok.svg";
import { ReactComponent as MinusIcon } from "app/icons/minus.svg";
import { ReactComponent as ExtensionIcon } from "app/icons/extension.svg";

type SettingsProps = {
  tabSlug?: string | null;
};

const RevealPrivateKey: React.FC = () => <RevealSecret reveal="private-key" />;
const RevealSeedPhrase: React.FC = () => <RevealSecret reveal="seed-phrase" />;

const TABS = [
  {
    slug: "reveal-private-key",
    title: "Reveal Private Key",
    Icon: KeyIcon,
    Component: RevealPrivateKey,
    color: "#3182CE",
    description: (
      <>
        Also known as "Export Account", reveals private key for your selected
        account.
      </>
    ),
  },
  {
    slug: "reveal-seed-phrase",
    title: "Reveal Seed Phrase",
    Icon: StickerIcon,
    Component: RevealSeedPhrase,
    color: "#F6AD55",
    description: (
      <>
        Also known as "Export Wallet", you may need this seed phrase to access
        your wallet and accounts on other devices.
      </>
    ),
  },
  {
    slug: "activate-account",
    title: "Activate Account",
    Icon: OkIcon,
    Component: ActivateAccount,
    color: "rgb(131, 179, 0)",
    description: (
      <>
        Use this section to activate your selected account by providing secret
        phrase. It may be necessary for ICO/Fundraiser or testnet faucet
        accounts.
      </>
    ),
  },
  {
    slug: "remove-account",
    title: "Remove Account",
    Icon: MinusIcon,
    Component: RemoveAccount,
    color: "rgb(245, 101, 101)",
    description: (
      <>
        Use this section to remove your selected account. Only imported accounts
        can be removed.
      </>
    ),
  },
  {
    slug: "about",
    title: "About",
    Icon: ExtensionIcon,
    Component: About,
    color: "#A0AEC0",
    description: <>Use this section to view meta info about Thanos Wallet.</>,
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
          Settings
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
                const { Icon, color, title } = activeTab;
                return (
                  <>
                    <Icon
                      className="mr-2 h-8 w-auto stroke-current"
                      style={{ stroke: color }}
                    />
                    {title}
                  </>
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
              {TABS.map(({ slug, title, description, Icon, color }, i) => {
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
                            "border-2 border-white-25",
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
                          {title}
                        </Link>

                        <p className="mt-1 text-sm font-light leading-5 text-gray-600">
                          {description}
                        </p>
                      </div>
                    </div>
                  </li>
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
