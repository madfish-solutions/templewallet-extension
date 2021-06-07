import React, {
  FC,
  FunctionComponent,
  SVGProps,
  ReactNode,
  Suspense,
  useLayoutEffect,
  useMemo,
} from "react";

import classNames from "clsx";
import { Props as TippyProps } from "tippy.js";

import Spinner from "app/atoms/Spinner";
import { useAppEnv } from "app/env";
import ErrorBoundary from "app/ErrorBoundary";
import { ReactComponent as DAppsIcon } from "app/icons/apps-alt.svg";
import { ReactComponent as ChevronRightIcon } from "app/icons/chevron-right.svg";
import { ReactComponent as ExploreIcon } from "app/icons/explore.svg";
import { ReactComponent as ReceiveIcon } from "app/icons/receive.svg";
import { ReactComponent as SendIcon } from "app/icons/send-alt.svg";
import { ReactComponent as SwapVerticalIcon } from "app/icons/swap-vertical.svg";
import PageLayout from "app/layouts/PageLayout";
import Activity from "app/templates/activity/Activity";
import AssetInfo from "app/templates/AssetInfo";
import { T, t } from "lib/i18n/react";
import {
  getAssetKey,
  TempleAccountType,
  TempleAsset,
  TempleAssetType,
  useAccount,
  useAssetBySlug,
  TEZ_ASSET,
} from "lib/temple/front";
import useTippy from "lib/ui/useTippy";
import {
  Link,
  Redirect,
  useLocation,
  navigate,
  HistoryAction,
} from "lib/woozie";

import { ExploreSelectors } from "./Explore.selectors";
import AddressChip from "./Explore/AddressChip";
import AddUnknownTokens from "./Explore/AddUnknownTokens";
import Assets from "./Explore/Assets";
import BakingSection from "./Explore/BakingSection";
import EditableTitle from "./Explore/EditableTitle";
import MainAssetBanner from "./Explore/MainAssetBanner";

type ExploreProps = {
  assetSlug?: string | null;
};

const tippyProps = {
  trigger: "mouseenter",
  hideOnClick: false,
  content: t("disabledForWatchOnlyAccount"),
  animation: "shift-away-subtle",
};

const Explore: FC<ExploreProps> = ({ assetSlug }) => {
  const { fullPage, registerBackHandler } = useAppEnv();
  const account = useAccount();
  const asset = useAssetBySlug(assetSlug);
  const { search } = useLocation();

  useLayoutEffect(() => {
    const usp = new URLSearchParams(search);
    if (asset && usp.get("after_token_added") === "true") {
      return registerBackHandler(() => {
        navigate("/", HistoryAction.Replace);
      });
    }
    return;
  }, [registerBackHandler, asset, search]);

  if (assetSlug && !asset) {
    return <Redirect to="/" />;
  }

  const accountPkh = account.publicKeyHash;
  const canSend = account.type !== TempleAccountType.WatchOnly;

  return (
    <PageLayout
      pageTitle={
        <>
          <ExploreIcon className="w-auto h-4 mr-1 stroke-current" />
          <T id="explore" />
          {asset && (
            <>
              <ChevronRightIcon className="w-auto h-4 mx-px stroke-current opacity-75" />
              <span className="font-normal">{asset.symbol}</span>
            </>
          )}
        </>
      }
    >
      {fullPage && (
        <>
          <EditableTitle />
          <hr className="mb-6" />
        </>
      )}

      <div
        className={classNames(
          "flex flex-col items-center",
          fullPage ? "mb-10" : "mb-6"
        )}
      >
        <AddressChip pkh={accountPkh} className="mb-6" />

        <MainAssetBanner accountPkh={accountPkh} asset={asset ?? TEZ_ASSET} />

        <div
          className="flex justify-around w-full mx-auto mt-6"
          style={{ maxWidth: "19rem" }}
        >
          <ActionButton
            label={<T id="receive" />}
            Icon={ReceiveIcon}
            href="/receive"
          />
          <ActionButton
            label={<T id="dApps" />}
            Icon={DAppsIcon}
            href="/dApps"
          />
          <ActionButton
            label={<T id="swap" />}
            Icon={SwapIcon}
            href={asset ? `/swap/${getAssetKey(asset)}` : "/swap"}
            disabled={!canSend}
            tippyProps={tippyProps}
          />
          <ActionButton
            label={<T id="send" />}
            Icon={SendIcon}
            href={asset ? `/send/${getAssetKey(asset)}` : "/send"}
            disabled={!canSend}
            tippyProps={tippyProps}
          />
        </div>
      </div>

      <SecondarySection asset={asset} />

      <AddUnknownTokens />
    </PageLayout>
  );
};

export default Explore;

const SwapIcon: FunctionComponent<SVGProps<SVGSVGElement>> = ({
  className,
  ...restProps
}) => {
  return (
    <SwapVerticalIcon
      className={classNames(className, "transform rotate-90")}
      {...restProps}
    />
  );
};

type ActionButtonProps = {
  label: React.ReactNode;
  Icon: FunctionComponent<SVGProps<SVGSVGElement>>;
  href: string;
  disabled?: boolean;
  tippyProps?: Partial<TippyProps>;
};

const ActionButton: FC<ActionButtonProps> = ({
  label,
  Icon,
  href,
  disabled,
  tippyProps = {},
}) => {
  const buttonRef = useTippy<HTMLButtonElement>(tippyProps);
  const commonButtonProps = useMemo(
    () => ({
      className: "flex flex-col items-center mx-3 px-1",
      type: "button" as const,
      children: (
        <>
          <div
            className={classNames(
              disabled ? "bg-blue-300" : "bg-blue-500",
              "rounded mb-1 flex items-center text-white"
            )}
            style={{ padding: "0 0.625rem", height: "2.75rem" }}
          >
            <Icon className="w-6 h-auto stroke-current stroke-2" />
          </div>
          <span
            className={classNames(
              "text-xs",
              disabled ? "text-blue-300" : "text-blue-500"
            )}
          >
            {label}
          </span>
        </>
      ),
    }),
    [disabled, Icon, label]
  );
  return disabled ? (
    <button ref={buttonRef} {...commonButtonProps} />
  ) : (
    <Link to={href} {...commonButtonProps} />
  );
};

const Delegation: FC = () => (
  <SuspenseContainer whileMessage={t("delegationInfoWhileMessage")}>
    <BakingSection />
  </SuspenseContainer>
);

type ActivityTabProps = {
  asset?: TempleAsset;
};

const ActivityTab: FC<ActivityTabProps> = ({ asset }) => {
  const account = useAccount();

  return (
    <SuspenseContainer whileMessage={t("operationHistoryWhileMessage")}>
      <Activity
        address={account.publicKeyHash}
        assetId={asset && getAssetKey(asset)}
      />
    </SuspenseContainer>
  );
};

function useTabSlug() {
  const { search } = useLocation();
  const tabSlug = useMemo(() => {
    const usp = new URLSearchParams(search);
    return usp.get("tab");
  }, [search]);
  return useMemo(() => tabSlug, [tabSlug]);
}

type SecondarySectionProps = {
  asset: TempleAsset | null;
  className?: string;
};

const SecondarySection: FC<SecondarySectionProps> = ({ asset, className }) => {
  const { fullPage } = useAppEnv();
  const tabSlug = useTabSlug();

  const tabs = useMemo<
    {
      slug: string;
      title: string;
      Component: FC;
      testID: string;
    }[]
  >(() => {
    if (!asset) {
      return [
        {
          slug: "assets",
          title: t("assets"),
          Component: Assets,
          testID: ExploreSelectors.AssetsTab,
        },
        {
          slug: "delegation",
          title: t("delegation"),
          Component: Delegation,
          testID: ExploreSelectors.DelegationTab,
        },
        {
          slug: "activity",
          title: t("activity"),
          Component: ActivityTab,
          testID: ExploreSelectors.ActivityTab,
        },
      ];
    }

    const activity = {
      slug: "activity",
      title: t("activity"),
      Component: () => <ActivityTab asset={asset} />,
      testID: ExploreSelectors.ActivityTab,
    };

    if (asset.type === TempleAssetType.TEZ) {
      return [activity];
    }

    return [
      activity,
      {
        slug: "about",
        title: t("about"),
        Component: () => <AssetInfo asset={asset} />,
        testID: ExploreSelectors.AboutTab,
      },
    ];
  }, [asset]);

  const { slug, Component } = useMemo(() => {
    const tab = tabSlug ? tabs.find((t) => t.slug === tabSlug) : null;
    return tab ?? tabs[0];
  }, [tabSlug, tabs]);

  return (
    <div
      className={classNames(
        "-mx-4",
        "shadow-top-light",
        fullPage && "rounded-t-md",
        className
      )}
    >
      <div
        className={classNames(
          "w-full max-w-sm mx-auto",
          "flex flex-wrap items-center justify-center"
        )}
      >
        {tabs.map((t) => {
          const active = slug === t.slug;

          return (
            <Link
              key={asset ? `asset_${t.slug}` : t.slug}
              to={(lctn) => ({ ...lctn, search: `?tab=${t.slug}` })}
              replace
              className={classNames(
                "w-1/3",
                "text-center cursor-pointer mb-1 pb-1 pt-2 px-3",
                "text-gray-500 text-sm font-medium",
                "border-t-2",
                active ? "border-primary-orange" : "border-transparent",
                active ? "text-primary-orange" : "hover:text-primary-orange",
                "transition ease-in-out duration-300"
              )}
              testID={t.testID}
            >
              {t.title}
            </Link>
          );
        })}
      </div>

      <div className={classNames("mx-4 mb-4", fullPage ? "mt-8" : "mt-4")}>
        {Component && <Component />}
      </div>
    </div>
  );
};

type SuspenseContainerProps = {
  whileMessage: string;
  fallback?: ReactNode;
};

const SuspenseContainer: FC<SuspenseContainerProps> = ({
  whileMessage,
  fallback = <SpinnerSection />,
  children,
}) => (
  <ErrorBoundary whileMessage={whileMessage}>
    <Suspense fallback={fallback}>{children}</Suspense>
  </ErrorBoundary>
);

const SpinnerSection: FC = () => (
  <div className="flex justify-center my-12">
    <Spinner theme="gray" className="w-20" />
  </div>
);
