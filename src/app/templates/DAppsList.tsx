import React, { FC, SVGProps, useCallback, useMemo, useState } from "react";

import classNames from "clsx";

import Money from "app/atoms/Money";
import { ReactComponent as ClickIcon } from "app/icons/click.svg";
import { ReactComponent as InfoIcon } from "app/icons/info.svg";
import { ReactComponent as LockIcon } from "app/icons/lock.svg";
import { ReactComponent as StarIcon } from "app/icons/star.svg";
import { ReactComponent as TagIcon } from "app/icons/tag.svg";
import InUSD from "app/templates/InUSD";
import SearchField from "app/templates/SearchField";
import { getDApps } from "lib/better-call-dev/dapps";
import { t } from "lib/i18n/react";
import { useRetryableSWR } from "lib/swr";
import { TEZ_ASSET } from "lib/temple/assets";

const dummyTvl = 1048576.123456;

const USED_TAGS = [
  "DEX",
  "NFT",
  "DAO",
  "Game",
  "Social",
  "Marketplace",
  "Farming",
  "Other",
];

const DAppsList: FC = () => {
  const { data } = useRetryableSWR("dapps-list", getDApps, { suspense: true });
  const dApps = useMemo(() => {
    return data!.map(({ categories: rawCategories, ...restProps }) => {
      const nonUniqueCategories = rawCategories.map((category) =>
        USED_TAGS.includes(category) ? category : "Other"
      );
      const categories = nonUniqueCategories.filter((name) => name !== "Other");
      if (categories.length !== nonUniqueCategories.length) {
        categories.push("Other");
      }

      return {
        categories,
        ...restProps,
      };
    });
  }, [data]);

  const [searchString, setSearchString] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleTagClick = useCallback((name: string) => {
    setSelectedTags((prevSelectedTags) => {
      const tagIndex = prevSelectedTags.indexOf(name);
      const newSelectedTags = [...prevSelectedTags];
      if (tagIndex === -1) {
        newSelectedTags.push(name);
      } else {
        newSelectedTags.splice(tagIndex, 1);
      }
      return newSelectedTags;
    });
  }, []);

  const matchingDApps = useMemo(() => {
    return dApps.filter(
      ({ name, categories }) =>
        name.toLowerCase().includes(searchString.toLowerCase()) &&
        selectedTags.every((selectedTag) => categories.includes(selectedTag))
    );
  }, [dApps, searchString, selectedTags]);

  return (
    <div className="w-full flex px-5 pt-2 pb-4">
      <div
        className="mx-auto flex flex-col items-center"
        style={{ maxWidth: "25rem" }}
      >
        <div className="mb-2 text-sm text-gray-600 flex items-center leading-tight">
          {t("tvl")}
          <InfoIcon
            style={{
              width: "0.625rem",
              height: "auto",
              marginLeft: "0.125rem",
            }}
            className="stroke-current"
            title="TODO: add text"
          />
        </div>
        <h1 className="text-2xl text-gray-900 mb-2 font-medium">
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
              className="mx-4 py-1 flex flex-col items-center"
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
        <SearchField
          className={classNames(
            "py-2 pl-8 pr-4",
            "border border-gray-300",
            "transition ease-in-out duration-200",
            "rounded-lg",
            "text-gray-700 text-sm leading-tight",
            "placeholder-alphagray"
          )}
          containerClassName="mb-4"
          placeholder={t("searchDApps")}
          searchIconClassName="h-4 w-auto"
          searchIconWrapperClassName="px-2 text-gray-700"
          value={searchString}
          onValueChange={setSearchString}
        />
        <div className="w-full flex justify-between mb-4">
          <div className="flex-1 mr-2 overflow-x-scroll">
            <div className="flex-1 mr-2 flex-wrap" style={{ width: "107%" }}>
              {USED_TAGS.map((tag) => (
                <Tag
                  key={tag}
                  name={tag}
                  onClick={handleTagClick}
                  selected={selectedTags.includes(tag)}
                />
              ))}
            </div>
          </div>
          <button className="text-gray-500" type="button">
            <StarIcon className="fill-current w-6 h-auto" />
          </button>
        </div>
        {matchingDApps.length === 0 && (
          <p className="text-sm text-center text-gray-700 mb-4">
            {t("noMatchingDAppsFound")}
          </p>
        )}
        {matchingDApps.map(
          ({ name, slug, website, logo, categories, soon }) => (
            <div key={slug} className="w-full mb-4 flex items-center">
              <a
                className="mr-4"
                href={website}
                target="_blank"
                rel="noreferrer"
              >
                <DAppsIcon name={name} logo={logo} />
              </a>
              <div className="flex-1 flex justify-between items-start">
                <div className="text-gray-600 text-xs leading-tight">
                  <p
                    className="text-gray-900"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    {name}
                  </p>
                  <DAppCharacteristic Icon={TagIcon}>
                    {categories.map((category) => `#${category}`).join(", ")}
                  </DAppCharacteristic>
                  {soon ? (
                    <p>{t("comingSoon")}</p>
                  ) : (
                    <>
                      <DAppCharacteristic Icon={LockIcon}>
                        ~1M tz = ~1B $
                      </DAppCharacteristic>
                      <DAppCharacteristic Icon={ClickIcon}>
                        10k
                      </DAppCharacteristic>
                    </>
                  )}
                </div>
                <button className="text-orange-500 p-1" type="button">
                  <StarIcon className="fill-current w-4 h-auto" />
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default DAppsList;

type TagProps = {
  name: string;
  onClick: (name: string) => void;
  selected: boolean;
};

const Tag: FC<TagProps> = ({ name, onClick, selected }) => {
  const handleClick = useCallback(() => onClick(name), [onClick, name]);

  return (
    <button
      className={classNames(
        "mr-2 mb-2 h-6 inline-flex items-center rounded-full px-5",
        "border border-gray-300 text-xs text-gray-900 hover:bg-gray-200",
        selected && "bg-gray-200"
      )}
      onClick={handleClick}
      type="button"
    >
      {t(name.toLowerCase()) || name}
    </button>
  );
};

type DAppCharacteristicProps = {
  Icon: React.FC<SVGProps<SVGSVGElement>>;
  children: React.ReactChild | React.ReactChild[];
};

const DAppCharacteristic: FC<DAppCharacteristicProps> = ({
  Icon,
  children,
}) => (
  <div className="leading-tight flex items-center mt-1">
    <Icon className="h-3 w-auto mr-1 fill-current" />
    {children}
  </div>
);

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
    {logo ? (
      <img className="rounded-2xl" alt={name} src={logo} />
    ) : (
      <span className="text-gray-700 text-xs">{name}</span>
    )}
  </div>
);
