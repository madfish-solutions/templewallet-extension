import React, { FC, useMemo, useState } from "react";

import classNames from "clsx";

import Money from "app/atoms/Money";
import { ReactComponent as InfoIcon } from "app/icons/info.svg";
import InUSD from "app/templates/InUSD";
import { getDApps } from "lib/better-call-dev/dapps";
import { t } from "lib/i18n/react";
import { useRetryableSWR } from "lib/swr";
import { TEZ_ASSET } from "lib/temple/assets";

const dummyTvl = 1048576.123456;

const DAppsList: FC = () => {
  const { data } = useRetryableSWR("dapps-list", getDApps, { suspense: true });
  const dApps = data!;

  const [searchString, setSearchString] = useState("");

  const allTags = useMemo(
    () =>
      dApps.reduce<string[]>(
        (prevTags, { categories }) => [
          ...prevTags,
          ...categories.filter((category) => !prevTags.includes(category)),
        ],
        []
      ),
    [dApps]
  );

  return (
    <div className="w-full flex px-5 pt-6 pb-8">
      <div
        className="mx-auto flex flex-col items-center"
        style={{ maxWidth: "25rem" }}
      >
        <div className="mb-2 text-sm text-gray-600 flex items-center leading-tight">
          {t("tvl")}{" "}
          <InfoIcon
            style={{ width: "0.625rem", height: "auto" }}
            className="stroke-current"
            title="TODO: add text"
          />
        </div>
        <h1 className="text-2xl text-gray-900 mb-2">
          ~<Money>{1048576.123456}</Money> <span>{TEZ_ASSET.symbol}</span>
        </h1>
        <InUSD volume={dummyTvl}>
          {(inUSD) => (
            <h2 className="mb-6 text-base text-gray-600">~{inUSD} $</h2>
          )}
        </InUSD>
        <span className="text-sm text-gray-600 mb-2">{t("promoted")}</span>
        <div className="rounded-lg bg-gray-100 w-full flex justify-center py-6 mb-6">
          {dApps.slice(0, 3).map(({ slug, name, logo, website }) => (
            <a
              className="mx-4 py-1"
              key={slug}
              href={website}
              target="_blank"
              rel="noreferrer"
            >
              <DAppsIcon className="mb-2" name={name} logo={logo} />
              <span
                className="w-20 text-center overflow-hidden text-gray-900"
                style={{ textOverflow: "ellipsis" }}
              >
                {name}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DAppsList;

type DAppsIconProps = {
  name: string;
  logo: string;
  className?: string;
};

const DAppsIcon: React.FC<DAppsIconProps> = ({ name, logo, className }) => (
  <div
    className={classNames(
      "bg-white w-20 h-20 border border-gray-300 rounded-2xl flex justify-center items-center",
      className
    )}
  >
    <img alt={name} src={logo} />
  </div>
);
