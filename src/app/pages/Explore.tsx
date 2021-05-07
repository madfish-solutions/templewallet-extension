import React, {
  FC,
  memo,
  ReactNode,
  Suspense,
  useLayoutEffect,
  useMemo,
} from "react";

import classNames from "clsx";

import Spinner from "app/atoms/Spinner";
import { useAppEnv } from "app/env";
import ErrorBoundary from "app/ErrorBoundary";
import { ReactComponent as ChevronRightIcon } from "app/icons/chevron-right.svg";
import { ReactComponent as ExploreIcon } from "app/icons/explore.svg";
import { ReactComponent as QRIcon } from "app/icons/qr.svg";
import { ReactComponent as SendIcon } from "app/icons/send.svg";
import PageLayout from "app/layouts/PageLayout";
import AssetInfo from "app/templates/AssetInfo";
import OperationHistory from "app/templates/OperationHistory";
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
          className="flex items-stretch w-full mx-auto mt-4"
          style={{ maxWidth: "18rem" }}
        >
          <div className="w-1/2 p-2">
            <Link
              to="/receive"
              className={classNames(
                "block w-full",
                "py-2 px-4 rounded",
                "border-2",
                "border-blue-500 hover:border-blue-600 focus:border-blue-600",
                "flex items-center justify-center",
                "text-blue-500 hover:text-blue-600 focus:text-blue-600",
                "shadow-sm hover:shadow focus:shadow",
                "text-base font-semibold",
                "transition ease-in-out duration-300"
              )}
              type="button"
              testID={ExploreSelectors.ReceiveButton}
            >
              <QRIcon
                className={classNames(
                  "-ml-2 mr-2",
                  "h-5 w-auto",
                  "stroke-current"
                )}
              />
              <T id="receive" />
            </Link>
          </div>

          <div className="w-1/2 p-2">
            <SendButton canSend={canSend} asset={asset} />
          </div>
        </div>
      </div>

      <SecondarySection asset={asset} />

      <AddUnknownTokens />
    </PageLayout>
  );
};

export default Explore;

type SendButtonProps = {
  canSend: boolean;
  asset: TempleAsset | null;
};

const SendButton = memo<SendButtonProps>(({ canSend, asset }) => {
  const tippyProps = {
    trigger: "mouseenter",
    hideOnClick: false,
    content: t("disabledForWatchOnlyAccount"),
    animation: "shift-away-subtle",
  };

  const sendButtonRef = useTippy<HTMLButtonElement>(tippyProps);
  const commonSendButtonProps = {
    className: classNames(
      "w-full",
      "py-2 px-4 rounded",
      "border-2",
      "border-blue-500",
      canSend && "hover:border-blue-600 focus:border-blue-600",
      "bg-blue-500",
      canSend && "hover:bg-blue-600 focus:bg-blue-600",
      canSend && "shadow-sm hover:shadow focus:shadow",
      !canSend && "opacity-50",
      "flex items-center justify-center",
      "text-white",
      "text-base font-semibold",
      "transition ease-in-out duration-300"
    ),
    children: (
      <>
        <SendIcon
          className={classNames(
            "-ml-3 -mt-1 mr-1",
            "h-5 w-auto",
            "transform -rotate-45",
            "stroke-current"
          )}
        />
        <T id="send" />
      </>
    ),
  };

  return canSend ? (
    <Link
      to={asset ? `/send/${getAssetKey(asset)}` : "/send"}
      type="button"
      testID={ExploreSelectors.SendButton}
      {...commonSendButtonProps}
    />
  ) : (
    <button ref={sendButtonRef} {...commonSendButtonProps} />
  );
});

const Delegation: FC = () => (
  <SuspenseContainer whileMessage={t("delegationInfoWhileMessage")}>
    <BakingSection />
  </SuspenseContainer>
);

type ActivityProps = {
  asset?: TempleAsset;
};

const Activity: FC<ActivityProps> = ({ asset }) => {
  const account = useAccount();

  return (
    <SuspenseContainer whileMessage={t("operationHistoryWhileMessage")}>
      <OperationHistory
        accountPkh={account.publicKeyHash}
        accountOwner={
          account.type === TempleAccountType.ManagedKT
            ? account.owner
            : undefined
        }
        asset={asset}
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

  const tabs = useMemo<{
    slug: string;
    title: string;
    Component: FC;
    testID: string;
  }[]>(() => {
    if (!asset) {
      return [
        {
          slug: "assets",
          title: t("assets"),
          Component: Assets,
          testID: ExploreSelectors.AssetsTab
        },
        {
          slug: "delegation",
          title: t("delegation"),
          Component: Delegation,
          testID: ExploreSelectors.DelegationTab
        },
        {
          slug: "activity",
          title: t("activity"),
          Component: Activity,
          testID: ExploreSelectors.ActivityTab
        },
      ];
    }

    const activity = {
      slug: "activity",
      title: t("activity"),
      Component: () => <Activity asset={asset} />,
      testID: ExploreSelectors.ActivityTab
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
        testID: ExploreSelectors.AboutTab
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
