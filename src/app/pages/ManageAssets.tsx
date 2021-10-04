import React, { FC, memo, useCallback, useMemo, useState } from "react";

import classNames from "clsx";
import { useDebounce } from "use-debounce";

import Checkbox from "app/atoms/Checkbox";
import { ReactComponent as AddIcon } from "app/icons/add-to-list.svg";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import { ReactComponent as ControlCentreIcon } from "app/icons/control-centre.svg";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";
import PageLayout from "app/layouts/PageLayout";
import { ManageAssetsSelectors } from "app/pages/ManageAssets.selectors";
import AssetIcon from "app/templates/AssetIcon";
import SearchAssetField from "app/templates/SearchAssetField";
import { T, t } from "lib/i18n/react";
import { AssetTypesEnum } from "lib/temple/assets/types";
import {
  useChainId,
  useAllKnownFungibleTokenSlugs,
  useAllTokensBaseMetadata,
  useFungibleTokens,
  isTokenDisplayed,
  useAccount,
  useAssetMetadata,
  getAssetName,
  getAssetSymbol,
  setTokenStatus,
  useAllKnownCollectibleTokenSlugs,
  useCollectibleTokens,
  useFilteredAssets,
} from "lib/temple/front";
import { ITokenStatus, ITokenType } from "lib/temple/repo";
import { useConfirm } from "lib/ui/dialog";
import { Link } from "lib/woozie";

interface Props {
  assetType: string;
}

const ManageAssets: FC<Props> = ({ assetType }) => (
  <PageLayout
    pageTitle={
      <>
        <ControlCentreIcon className="w-auto h-4 mr-1 stroke-current" />
        <T
          id={
            assetType === AssetTypesEnum.Collectibles
              ? "manageCollectibles"
              : "manageTokens"
          }
        />
      </>
    }
  >
    <ManageAssetsContent assetType={assetType} />
  </PageLayout>
);

export default ManageAssets;

export type TokenStatuses = Record<
  string,
  { displayed: boolean; removed: boolean }
>;

const ManageAssetsContent: FC<Props> = ({ assetType }) => {
  const isCollectibles = assetType === AssetTypesEnum.Collectibles;
  const chainId = useChainId(true)!;
  const account = useAccount();
  const address = account.publicKeyHash;

  const {
    data: allCollectiblesSlugs = [],
    isValidating: allKnownCollectiblesTokenSlugsLoading,
  } = useAllKnownCollectibleTokenSlugs(chainId);
  const {
    data: collectibles = [],
    revalidate: revalidateCollectibles,
    isValidating: collectibleTokensLoading,
  } = useCollectibleTokens(chainId, address, false);

  const {
    data: allTokenSlugs = [],
    isValidating: allKnownFungibleTokenSlugsLoading,
  } = useAllKnownFungibleTokenSlugs(chainId);
  const {
    data: tokens = [],
    revalidate: revalidateTokens,
    isValidating: fungibleTokensLoading,
  } = useFungibleTokens(chainId, address);

  const assets = isCollectibles ? collectibles : tokens;
  const slugs = isCollectibles ? allCollectiblesSlugs : allTokenSlugs;
  const revalidate = isCollectibles ? revalidateCollectibles : revalidateTokens;

  const tokenStatuses = useMemo(() => {
    const statuses: TokenStatuses = {};
    for (const t of assets) {
      statuses[t.tokenSlug] = {
        displayed: isTokenDisplayed(t),
        removed: t.status === ITokenStatus.Removed,
      };
    }
    return statuses;
  }, [assets]);

  const loading =
    allKnownFungibleTokenSlugsLoading ||
    fungibleTokensLoading ||
    allKnownCollectiblesTokenSlugsLoading ||
    collectibleTokensLoading;

  const allTokensBaseMetadata = useAllTokensBaseMetadata();

  const [searchValue, setSearchValue] = useState("");
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const managedTokens = useMemo(
    () =>
      slugs.filter(
        (slug) => slug in allTokensBaseMetadata && !tokenStatuses[slug]?.removed
      ),
    [slugs, allTokensBaseMetadata, tokenStatuses]
  );

  const filteredTokens = useFilteredAssets(managedTokens, searchValueDebounced);

  const confirm = useConfirm();

  const handleAssetUpdate = useCallback(
    async (assetSlug: string, status: ITokenStatus) => {
      try {
        if (status === ITokenStatus.Removed) {
          const confirmed = await confirm({
            title:
              assetType === AssetTypesEnum.Collectibles
                ? t("deleteCollectibleConfirm")
                : t("deleteTokenConfirm"),
          });
          if (!confirmed) return;
        }

        await setTokenStatus(
          assetType === AssetTypesEnum.Collectibles
            ? ITokenType.Collectible
            : ITokenType.Fungible,
          chainId,
          address,
          assetSlug,
          status
        );
        await revalidate();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        alert(err.message);
      }
    },
    [chainId, address, confirm, revalidate, assetType]
  );

  return (
    <div className="w-full max-w-sm mx-auto mb-6">
      <div className="mt-1 mb-3 w-full flex items-strech">
        <SearchAssetField value={searchValue} onValueChange={setSearchValue} />

        <Link
          to="/add-asset"
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
          <T
            id={
              assetType === AssetTypesEnum.Collectibles
                ? "addCollectible"
                : "addToken"
            }
          />
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
          {filteredTokens.map((slug, i, arr) => {
            const last = i === arr.length - 1;

            return (
              <ListItem
                key={slug}
                assetSlug={slug}
                last={last}
                checked={tokenStatuses[slug]?.displayed ?? false}
                onUpdate={handleAssetUpdate}
                assetType={assetType}
              />
            );
          })}
        </div>
      ) : loading ? null : (
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
                  {assetType === AssetTypesEnum.Collectibles ? (
                    <T id={"addCollectible"} />
                  ) : (
                    <T id={"addToken"} />
                  )}
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
  assetSlug: string;
  last: boolean;
  checked: boolean;
  onUpdate: (assetSlug: string, status: ITokenStatus) => void;
  assetType: string;
};

const ListItem = memo<ListItemProps>(
  ({ assetSlug, last, checked, onUpdate }) => {
    const metadata = useAssetMetadata(assetSlug);

    const handleCheckboxChange = useCallback(
      (evt) => {
        onUpdate(
          assetSlug,
          evt.target.checked ? ITokenStatus.Enabled : ITokenStatus.Disabled
        );
      },
      [assetSlug, onUpdate]
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
        <AssetIcon
          assetSlug={assetSlug}
          size={32}
          className="mr-3 flex-shrink-0"
        />

        <div className="flex items-center">
          <div className="flex flex-col items-start">
            <div
              className={classNames("text-sm font-normal text-gray-700")}
              style={{ marginBottom: "0.125rem" }}
            >
              {getAssetName(metadata)}
            </div>

            <div className={classNames("text-xs font-light text-gray-600")}>
              {getAssetSymbol(metadata)}
            </div>
          </div>
        </div>

        <div className="flex-1" />

        <div
          className={classNames(
            "mr-2 p-1",
            "rounded-full",
            "text-gray-400 hover:text-gray-600",
            "hover:bg-black hover:bg-opacity-5",
            "transition ease-in-out duration-200"
          )}
          onClick={(evt) => {
            evt.preventDefault();
            onUpdate(assetSlug, ITokenStatus.Removed);
          }}
        >
          <CloseIcon
            className="w-auto h-4 stroke-current stroke-2"
            title={t("delete")}
          />
        </div>

        <Checkbox checked={checked} onChange={handleCheckboxChange} />
      </label>
    );
  }
);
