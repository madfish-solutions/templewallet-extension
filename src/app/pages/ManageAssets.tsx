import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import {
  useTokens,
  getAssetKey,
  ThanosAsset,
  mergeAssets,
  searchAssets,
  ThanosAssetType,
  useNetwork,
} from "lib/thanos/front";
import PageLayout from "app/layouts/PageLayout";
import AssetIcon from "app/templates/AssetIcon";
import SearchAssetField from "app/templates/SearchAssetField";
import Checkbox from "app/atoms/Checkbox";
import { ReactComponent as ControlCentreIcon } from "app/icons/control-centre.svg";
import { ReactComponent as AddIcon } from "app/icons/add-to-list.svg";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";

const ManageAssets: React.FC = () => (
  <PageLayout
    pageTitle={
      <>
        <ControlCentreIcon className="w-auto h-4 mr-1 stroke-current" />
        Manage Assets
      </>
    }
  >
    <ManageAssetsContent />
  </PageLayout>
);

export default ManageAssets;

const ManageAssetsContent: React.FC = () => {
  const network = useNetwork();
  const { displayedTokens, hiddenTokens, addToken, removeToken } = useTokens();

  const netIdRef = React.useRef<string>();
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

  if (!sortIndexes.current || netIdRef.current !== network.id) {
    netIdRef.current = network.id;
    sortIndexes.current = new Map(
      checkableTokens.map((a, i) => [getAssetKey(a), i])
    );
  }

  const [searchValue, setSearchValue] = React.useState("");

  const filteredTokens = React.useMemo(
    () => searchAssets(checkableTokens, searchValue),
    [checkableTokens, searchValue]
  );

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
        >
          <AddIcon
            className={classNames("mr-1 h-5 w-auto stroke-current stroke-2")}
          />
          Add Token
        </Link>
      </div>

      {/* <button
        className={classNames(
          "mb-3 w-full",
          "py-2 px-4",
          "rounded-lg",
          "flex items-center justify-center",
          "text-primary-orange bg-primary-orange bg-opacity-5",
          "border border-primary-orange border-opacity-50",
          "text-base"
        )}
      >
        <AddIcon className="w-auto h-5 mr-2 stroke-current" />
        Add New Token
      </button> */}

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

            <span className="">No assets found</span>
          </p>

          <p className={classNames("text-center text-xs font-light")}>
            If you don't see your asset,
            <br />
            try to click <b>Add Token</b>.
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
