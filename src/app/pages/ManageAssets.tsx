import * as React from "react";
import classNames from "clsx";
import {
  useTokens,
  getAssetKey,
  ThanosAsset,
  mergeAssets,
  ThanosAssetType,
} from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import AssetIcon from "app/templates/AssetIcon";
import Checkbox from "app/atoms/Checkbox";
import { ReactComponent as AddToListIcon } from "app/icons/add-to-list.svg";

const ManageAssets: React.FC = () => (
  <PageLayout
    pageTitle={
      <>
        <AddToListIcon className="w-auto h-4 mr-1 stroke-current" />
        Manage Assets
      </>
    }
  >
    <ManageAssetsContent />
  </PageLayout>
);

export default ManageAssets;

const ManageAssetsContent: React.FC = () => {
  const { displayedTokens, hiddenTokens, addToken, removeToken } = useTokens();

  const sortIndexes = React.useRef<Map<string, number>>();

  const checkableTokens = React.useMemo(() => {
    const unsorted = mergeAssets(
      displayedTokens.map(toChecked),
      hiddenTokens.map(toUnchecked)
    );
    const iMap = sortIndexes.current;
    if (!iMap) return unsorted;

    return unsorted.sort((a, b) => {
      const aIndex = iMap.get(getAssetKey(a)) ?? 0;
      const bIndex = iMap.get(getAssetKey(b)) ?? 0;
      return aIndex - bIndex;
    });
  }, [displayedTokens, hiddenTokens]);

  if (!sortIndexes.current) {
    sortIndexes.current = new Map(
      checkableTokens.map((a, i) => [getAssetKey(a), i])
    );
  }

  const handleAssetChecked = React.useCallback(
    (asset: CheckableAsset, checked: boolean) => {
      const plain = toPlain(asset);

      if (plain.type !== ThanosAssetType.XTZ) {
        if (checked) {
          addToken(plain);
        } else {
          removeToken(plain);
        }
      }
    },
    [addToken, removeToken]
  );

  return (
    <div className={classNames("w-full max-w-sm mx-auto")}>
      <div
        className={classNames(
          "w-full overflow-hidden",
          "border rounded-md",
          "flex flex-col",
          "text-gray-700 text-sm leading-tight"
        )}
      >
        {checkableTokens.map((asset, i, arr) => {
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
    </div>
  );
};

type ListItemProps = {
  asset: CheckableAsset;
  last: boolean;
  checked: boolean;
  onChecked: (asset: CheckableAsset, checked: boolean) => void;
};

const ListItem = React.memo<ListItemProps>(
  ({ asset, last, checked, onChecked }) => {
    const handleCheckboxChange = React.useCallback(
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
        <AssetIcon asset={asset} size={32} className="mr-3" />

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
  }
);

type CheckableAsset = ThanosAsset & { checked: boolean };

function toPlain({ checked, ...asset }: CheckableAsset): ThanosAsset {
  return asset;
}

function toChecked(asset: ThanosAsset): CheckableAsset {
  return { ...asset, checked: true };
}

function toUnchecked(asset: ThanosAsset): CheckableAsset {
  return { ...asset, checked: false };
}
