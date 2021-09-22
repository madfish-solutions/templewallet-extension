import React, { useMemo, useState } from "react";

import classNames from "clsx";
import { useDebounce } from "use-debounce";

import { T } from "../../../lib/i18n/react";
import {
  searchAssets,
  useAccount,
  useAllTokensBaseMetadata,
  useChainId,
  useCollectibleTokens,
} from "../../../lib/temple/front";
import { Link } from "../../../lib/woozie";
import { ReactComponent as AddToListIcon } from "../../icons/add-to-list.svg";
import SearchAssetField from "../../templates/SearchAssetField";
import { AssetsSelectors } from "../Explore/Assets.selectors";
import CollectibleItem from "./CollectibleItem";

const assetType = "collectibles";

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

  const { assetSlugs } = useMemo(() => {
    const assetSlugs = [];

    for (const { tokenSlug } of collectibles) {
      if (tokenSlug in allTokensBaseMetadata) {
        assetSlugs.push(tokenSlug);
      }
    }

    return { assetSlugs };
  }, [collectibles, allTokensBaseMetadata]);

  const [searchValue, setSearchValue] = useState("");
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredAssets = useMemo(
    () => searchAssets(searchValueDebounced, assetSlugs, allTokensBaseMetadata),
    [searchValueDebounced, assetSlugs, allTokensBaseMetadata]
  );

  return (
    <div className={classNames("w-full max-w-sm mx-auto")}>
      <div className="mt-1 mb-3 w-full flex items-strech">
        <SearchAssetField value={searchValue} onValueChange={setSearchValue} />

        <Link
          to={`/manage-assets/${assetType}`}
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
        {filteredAssets.map((item) => (
          <CollectibleItem key={item} assetSlug={item} />
        ))}
      </div>
    </div>
  );
};

export default CollectiblesList;
