import React, { FC, SVGProps, useCallback, useMemo } from "react";

import BigNumber from "bignumber.js";

import Money from "app/atoms/Money";
import { useAppEnv } from "app/env";
import { ReactComponent as LockIcon } from "app/icons/lock.svg";
import { ReactComponent as TagIcon } from "app/icons/tag.svg";
import DAppIcon from "app/templates/DAppsList/DAppIcon";
import StarButton from "app/templates/DAppsList/StarButton";
import { AnalyticsEventCategory, useAnalytics } from "lib/analytics";
import { CustomDAppInfo } from "lib/custom-dapps-api";
import { t } from "lib/i18n/react";
import { TEZ_ASSET, useAssetUSDPrice } from "lib/temple/front";

import { DAppStoreSelectors } from "../DAppsList.selectors";

type DAppItemProps = CustomDAppInfo & {
  onStarClick: (newIsFavorite: boolean, slug: string) => void;
  isFavorite: boolean;
};

const DAppItem: FC<DAppItemProps> = ({
  errorOccurred,
  slug,
  website,
  name,
  logo,
  categories,
  soon,
  onStarClick,
  isFavorite,
  tvl,
}) => {
  const { popup } = useAppEnv();
  const { trackEvent } = useAnalytics();
  const handleStarClick = useCallback(() => {
    onStarClick(!isFavorite, slug);
  }, [isFavorite, onStarClick, slug]);
  const tzUsdPrice = useAssetUSDPrice(TEZ_ASSET);
  const tvlInTez = useMemo(() => {
    if (typeof tzUsdPrice === "number") {
      return new BigNumber(tvl).div(tzUsdPrice).decimalPlaces(6);
    }
    return undefined;
  }, [tzUsdPrice, tvl]);
  const handleLinkClick = useCallback(() => {
    trackEvent(
      DAppStoreSelectors.DAppOpened,
      AnalyticsEventCategory.ButtonPress,
      { website, name }
    );
  }, [trackEvent, website, name]);

  return (
    <div className="w-full mb-4 flex items-center">
      <a
        className="mr-4"
        href={website}
        target="_blank"
        rel="noreferrer"
        onClick={handleLinkClick}
      >
        <DAppIcon name={name} logo={logo} />
      </a>
      <div className="flex-1 flex justify-between items-start">
        <div className="text-gray-600 text-xs leading-tight">
          <p className="text-gray-900" style={{ fontSize: "0.8125rem" }}>
            {name}
          </p>
          <DAppCharacteristic Icon={TagIcon}>
            {categories.map((category) => `#${category}`).join(", ")}
          </DAppCharacteristic>
          {soon && <DAppCharacteristic>{t("comingSoon")}</DAppCharacteristic>}
          {errorOccurred && (
            <DAppCharacteristic>{"- - - - - - - - -"}</DAppCharacteristic>
          )}
          {!soon && !errorOccurred && tvlInTez && (
            <DAppCharacteristic Icon={LockIcon}>
              ~ $
              <Money shortened smallFractionFont={false}>
                {tvl}
              </Money>
            </DAppCharacteristic>
          )}
        </div>
        {!popup && (
          <StarButton
            className="p-1"
            iconClassName="w-4 h-auto"
            isActive={isFavorite}
            onClick={handleStarClick}
          />
        )}
      </div>
    </div>
  );
};

export default DAppItem;

type DAppCharacteristicProps = {
  Icon?: React.FC<SVGProps<SVGSVGElement>>;
  children: React.ReactChild | React.ReactChild[];
};

const DAppCharacteristic: FC<DAppCharacteristicProps> = ({
  Icon,
  children,
}) => (
  <div className="leading-tight flex items-center mt-1">
    {Icon && <Icon className="h-3 w-auto mr-1 fill-current" />}
    {children}
  </div>
);
