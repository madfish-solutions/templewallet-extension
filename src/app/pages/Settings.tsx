import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import { useAppEnv } from "app/env";
import PageLayout from "app/layouts/PageLayout";
import { ReactComponent as KeyIcon } from "app/icons/key.svg";
import RevealSeedPhrase from "./Settings/RevealSeedPhrase";

type SettingsProps = {
  tabSlug?: string | null;
};

const TABS = [
  {
    slug: "reveal_seed_phrase",
    title: "Reveal Seed Phrase",
    Icon: KeyIcon,
    Component: RevealSeedPhrase,
    color: "#3182CE",
    bgColor: "rgba(49, 130, 206, 0.05)"
  }
];

const Settings: React.FC<SettingsProps> = ({ tabSlug }) => {
  const appEnv = useAppEnv();

  const activeTab = React.useMemo(
    () => TABS.find(t => t.slug === tabSlug) || null,
    [tabSlug]
  );

  return (
    <PageLayout>
      <div className="py-4">
        <h1
          className={classNames(
            "mb-2",
            "flex items-center justify-center",
            "text-2xl font-light text-gray-700 text-center"
          )}
        >
          {activeTab
            ? (() => {
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
              })()
            : "Settings"}
        </h1>

        <hr />

        <div className="mt-6">
          {activeTab ? (
            <activeTab.Component />
          ) : (
            <div className="flex flex-strech">
              {TABS.map(({ slug, title, Icon, color, bgColor }) => (
                <div
                  key={slug}
                  className={classNames(
                    appEnv.fullPage ? "w-1/2 px-6" : "w-full"
                  )}
                >
                  <Link
                    to={`/settings/${slug}`}
                    className={classNames(
                      "block w-full",
                      "rounded-md overflow-hidden",
                      "border",
                      "p-4",
                      "flex flex-col items-center justify-center",
                      "text-gray-500 text-lg",
                      "transition ease-in-out duration-300",
                      "opacity-90 hover:opacity-100 focus:opacity-100"
                    )}
                    style={{
                      backgroundColor: bgColor,
                      borderColor: color,
                      color
                    }}
                  >
                    <Icon className="h-16 w-auto stroke-current stroke" />
                    {title}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
