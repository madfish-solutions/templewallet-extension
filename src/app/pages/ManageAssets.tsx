import React, { FC, memo, useCallback, useMemo, useRef, useState } from "react";

import classNames from "clsx";

import Checkbox from "app/atoms/Checkbox";
import { ReactComponent as AddIcon } from "app/icons/add-to-list.svg";
import { ReactComponent as ControlCentreIcon } from "app/icons/control-centre.svg";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";
import PageLayout from "app/layouts/PageLayout";
import AssetIcon from "app/templates/AssetIcon";
import SearchAssetField from "app/templates/SearchAssetField";
import { T } from "lib/i18n/react";
import {
  useTokens,
  getAssetKey,
  TempleAsset,
  searchAssets,
  TempleAssetType,
  useNetwork,
} from "lib/temple/front";
import { Link } from "lib/woozie";

import { ManageAssetsSelectors } from "./ManageAssets.selectors";

const ManageAssets: FC = () => (
  <PageLayout
    pageTitle={
      <>
        <ControlCentreIcon className="w-auto h-4 mr-1 stroke-current" />
        <T id="manageAssets" />
      </>
    }
  >
    <ManageAssetsContent />
  </PageLayout>
);

export default ManageAssets;

const ManageAssetsContent: FC = () => {
  const network = useNetwork();
  const { displayedAndHiddenTokens, updateToken } = useTokens();

  const netIdRef = useRef<string>();
  const sortIndexes = useRef<Map<string, number>>();

  const checkableTokens = useMemo(() => {
    const unsorted = displayedAndHiddenTokens.map((t) =>
      t.status === "displayed" ? toChecked(t) : toUnchecked(t)
    );
    const iMap = sortIndexes.current;
    if (!iMap) return unsorted;

    return unsorted.sort((a, b) => {
      const aIndex = iMap.get(getAssetKey(a)) ?? 0;
      const bIndex = iMap.get(getAssetKey(b)) ?? 0;
      return aIndex - bIndex;
    });
  }, [displayedAndHiddenTokens]);

  if (!sortIndexes.current || netIdRef.current !== network.id) {
    netIdRef.current = network.id;
    sortIndexes.current = new Map(
      checkableTokens.map((a, i) => [getAssetKey(a), i])
    );
  }

  const [searchValue, setSearchValue] = useState("");

  const filteredTokens = useMemo(
    () => searchAssets(checkableTokens, searchValue),
    [checkableTokens, searchValue]
  );

  const handleAssetChecked = useCallback(
    (asset: CheckableAsset, checked: boolean) => {
      const plain = toPlain(asset);

      if (plain.type !== TempleAssetType.TEZ) {
        updateToken(plain, { status: checked ? "displayed" : "hidden" });
      }
    },
    [updateToken]
  );

  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      <div className="mt-1 mb-3 w-full flex items-strech">
        <SearchAssetField value={searchValue} onValueChange={setSearchValue} />

        <Link
          to="/add-token"
          className={classNames(
            "ml-2 flex-shrink-0",
            "px-3 py-1",
            "rounded overflow-hidden",
            "flex items-center",
            "text-gray-600 text-sm",
            "transition ease-in-out duration-200",
            "hover:bg-gray-100",
            "opacity-75 hover:opacity-100 focus:opacity-100"
          )}
          testID={ManageAssetsSelectors.AddTokenButton}
        >
          <AddIcon
            className={classNames("mr-1 h-5 w-auto stroke-current stroke-2")}
          />
          <T id="addToken" />
        </Link>
      </div>

      {filteredTokens.length > 0 ? (
        <div
          className={classNames(
            "w-full overflow-hidden",
            "border rounded-md",
            "flex flex-col",
            "text-gray-700 text-sm leading-tight"
          )}
        >
          {filteredTokens.map((asset, i, arr) => {
            const last = i === arr.length - 1;
            const key = getAssetKey(asset);

            return (
              <ListItem
                key={key}
                asset={asset}
                last={last}
                checked={asset.checked}
                onChecked={handleAssetChecked}
              />
            );
          })}
        </div>
      ) : (
        <div
          className={classNames(
            "my-8",
            "flex flex-col items-center justify-center",
            "text-gray-500"
          )}
        >
          <p
            className={classNames(
              "mb-2",
              "flex items-center justify-center",
              "text-gray-600 text-base font-light"
            )}
          >
            {Boolean(searchValue) && (
              <SearchIcon className="w-5 h-auto mr-1 stroke-current" />
            )}

            <span>
              <T id="noAssetsFound" />
            </span>
          </p>

          <p className={classNames("text-center text-xs font-light")}>
            <T
              id="ifYouDontSeeYourAsset"
              substitutions={[
                <b>
                  <T id="addToken" />
                </b>,
              ]}
            />
          </p>
        </div>
      )}
    </div>
  );
};

type ListItemProps = {
  asset: CheckableAsset;
  last: boolean;
  checked: boolean;
  onChecked: (asset: CheckableAsset, checked: boolean) => void;
};

const ListItem = memo<ListItemProps>(({ asset, last, checked, onChecked }) => {
  const handleCheckboxChange = useCallback(
    (evt) => {
      onChecked(asset, evt.target.checked);
    },
    [asset, onChecked]
  );

  return (
    <label
      className={classNames(
        "block w-full",
        "overflow-hidden",
        !last && "border-b border-gray-200",
        checked ? "bg-gray-100" : "hover:bg-gray-100 focus:bg-gray-100",
        "flex items-center py-2 px-3",
        "text-gray-700",
        "transition ease-in-out duration-200",
        "focus:outline-none",
        "cursor-pointer"
      )}
    >
      <AssetIcon asset={asset} size={32} className="mr-3 flex-shrink-0" />

      <div className="flex items-center">
        <div className="flex flex-col items-start">
          <div
            className={classNames("text-sm font-normal text-gray-700")}
            style={{ marginBottom: "0.125rem" }}
          >
            {asset.name}
          </div>

          <div className={classNames("text-xs font-light text-gray-600")}>
            {asset.symbol}
          </div>
        </div>
      </div>

      <div className="flex-1" />

      <Checkbox checked={checked} onChange={handleCheckboxChange} />
    </label>
  );
});

type CheckableAsset = TempleAsset & { checked: boolean };

function toPlain({ checked, ...asset }: CheckableAsset): TempleAsset {
  return asset;
}

function toChecked(asset: TempleAsset): CheckableAsset {
  return { ...asset, checked: true };
}

function toUnchecked(asset: TempleAsset): CheckableAsset {
  return { ...asset, checked: false };
}
