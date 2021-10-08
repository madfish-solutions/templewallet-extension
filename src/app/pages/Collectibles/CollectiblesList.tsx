import React, { useMemo, useState } from "react";

import classNames from "clsx";
import { useDebounce } from "use-debounce";

import { ReactComponent as AddToListIcon } from "app/icons/add-to-list.svg";
import CollectibleItem from "app/pages/Collectibles/CollectibleItem";
import { AssetsSelectors } from "app/pages/Explore/Assets.selectors";
import SearchAssetField from "app/templates/SearchAssetField";
import { T } from "lib/i18n/react";
import { AssetTypesEnum } from "lib/temple/assets/types";
import {
  useAccount,
  useAllTokensBaseMetadata,
  useChainId,
  useCollectibleTokens,
  useFilteredAssets,
} from "lib/temple/front";
import { Link } from "lib/woozie";

const CollectiblesList = () => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const address = account.publicKeyHash;
  const { data: collectibles = [] } = useCollectibleTokens(
    chainId,
    address,
    true
  );

  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const assetSlugs = useMemo(() => {
    const assetSlugs = [];

    for (const { tokenSlug } of collectibles) {
      if (tokenSlug in allTokensBaseMetadata) {
        assetSlugs.push(tokenSlug);
      }
    }

    return assetSlugs;
  }, [collectibles, allTokensBaseMetadata]);

  const [searchValue, setSearchValue] = useState("");
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredAssets = useFilteredAssets(assetSlugs, searchValueDebounced);

  return (
    <div className={classNames("w-full max-w-sm mx-auto")}>
      <div className="mt-1 mb-3 w-full flex items-strech">
        <SearchAssetField value={searchValue} onValueChange={setSearchValue} />

        <Link
          to={`/manage-assets/${AssetTypesEnum.Collectibles}`}
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
          testID={AssetsSelectors.ManageButton}
        >
          <AddToListIcon
            className={classNames("mr-1 h-5 w-auto stroke-current stroke-2")}
          />
          <T id="manage" />
        </Link>
      </div>
      <div className="mt-1 mb-3 w-full border rounded border-gray-200">
        {filteredAssets.length === 0 ? (
          <p className={"text-gray-600 text-center text-xs py-6"}>
            <T id="zeroCollectibleText" />
          </p>
        ) : (
          <>
            {filteredAssets.map((item, index) => (
              <CollectibleItem
                key={item}
                assetSlug={item}
                index={index}
                itemsLength={filteredAssets.length}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default CollectiblesList;
