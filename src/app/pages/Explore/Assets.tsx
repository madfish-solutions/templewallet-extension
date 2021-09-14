import React, {
  FC,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { cache } from "swr";
import { useDebounce } from "use-debounce";

import Money from "app/atoms/Money";
import { ReactComponent as AddToListIcon } from "app/icons/add-to-list.svg";
import { ReactComponent as ChevronRightIcon } from "app/icons/chevron-right.svg";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";
import AssetIcon from "app/templates/AssetIcon";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import SearchAssetField from "app/templates/SearchAssetField";
import { T } from "lib/i18n/react";
import {
  useAccount,
  useBalanceSWRKey,
  useChainId,
  useDisplayedFungibleTokens,
  useAssetMetadata,
  getAssetSymbol,
  getAssetName,
  useAllAssetsBaseMetadata,
  searchAssets,
} from "lib/temple/front";
import { Link, navigate } from "lib/woozie";

import { AssetsSelectors } from "./Assets.selectors";

const Assets: FC = () => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const address = account.publicKeyHash;

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, address);

  const allAssetsBaseMetadata = useAllAssetsBaseMetadata();

  const { assetSlugs, latestBalances } = useMemo(() => {
    const assetSlugs = ["tez"];
    const latestBalances: Record<string, string> = {};

    for (const { tokenSlug, latestBalance } of tokens) {
      if (tokenSlug in allAssetsBaseMetadata) {
        assetSlugs.push(tokenSlug);
      }
      if (latestBalance) {
        latestBalances[tokenSlug] = latestBalance;
      }
    }

    return { assetSlugs, latestBalances };
  }, [tokens, allAssetsBaseMetadata]);

  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const searchValueExist = useMemo(() => Boolean(searchValue), [searchValue]);
  const [searchValueDebounced] = useDebounce(searchValue, 300);

  const filteredAssets = useMemo(
    () => searchAssets(searchValueDebounced, assetSlugs, allAssetsBaseMetadata),
    [searchValueDebounced, assetSlugs, allAssetsBaseMetadata]
  );

  const activeAsset = useMemo(() => {
    return searchFocused && searchValueExist && filteredAssets[activeIndex]
      ? filteredAssets[activeIndex]
      : null;
  }, [filteredAssets, searchFocused, searchValueExist, activeIndex]);

  useEffect(() => {
    if (activeIndex !== 0 && activeIndex >= filteredAssets.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredAssets.length]);

  const handleSearchFieldFocus = useCallback(() => {
    setSearchFocused(true);
  }, [setSearchFocused]);

  const handleSearchFieldBlur = useCallback(() => {
    setSearchFocused(false);
  }, [setSearchFocused]);

  useEffect(() => {
    if (!activeAsset) return;

    const handleKeyup = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case "Enter":
          navigate(toExploreAssetLink(activeAsset));
          break;

        case "ArrowDown":
          setActiveIndex((i) => i + 1);
          break;

        case "ArrowUp":
          setActiveIndex((i) => (i > 0 ? i - 1 : 0));
          break;
      }
    };

    window.addEventListener("keyup", handleKeyup);
    return () => window.removeEventListener("keyup", handleKeyup);
  }, [activeAsset, setActiveIndex]);

  return (
    <div className={classNames("w-full max-w-sm mx-auto")}>
      <div className="mt-1 mb-3 w-full flex items-strech">
        <SearchAssetField
          value={searchValue}
          onValueChange={setSearchValue}
          onFocus={handleSearchFieldFocus}
          onBlur={handleSearchFieldBlur}
        />

        <Link
          to="/manage-assets"
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

      {filteredAssets.length > 0 ? (
        <div
          className={classNames(
            "w-full overflow-hidden",
            "border rounded-md",
            "flex flex-col",
            "text-gray-700 text-sm leading-tight"
          )}
        >
          <TransitionGroup key={chainId}>
            {filteredAssets.map((asset, i, arr) => {
              const last = i === arr.length - 1;
              const active = activeAsset ? asset === activeAsset : false;

              return (
                <CSSTransition
                  key={asset}
                  timeout={300}
                  classNames={{
                    enter: "opacity-0",
                    enterActive: classNames(
                      "opacity-100",
                      "transition ease-out duration-300"
                    ),
                    exit: classNames(
                      "opacity-0",
                      "transition ease-in duration-300"
                    ),
                  }}
                  unmountOnExit
                >
                  <ListItem
                    assetSlug={asset}
                    last={last}
                    active={active}
                    accountPkh={account.publicKeyHash}
                    latestBalance={latestBalances[asset]}
                  />
                </CSSTransition>
              );
            })}
          </TransitionGroup>
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
            {searchValueExist && (
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
                  <T id="manage" />
                </b>,
              ]}
            />
          </p>
        </div>
      )}
    </div>
  );
};

export default Assets;

type ListItemProps = {
  assetSlug: string;
  last: boolean;
  active: boolean;
  accountPkh: string;
  latestBalance?: string;
};

const ListItem = memo<ListItemProps>(
  ({ assetSlug, last, active, accountPkh }) => {
    const metadata = useAssetMetadata(assetSlug);

    const balanceSWRKey = useBalanceSWRKey(assetSlug, accountPkh);
    const balanceAlreadyLoaded = useMemo(
      () => cache.has(balanceSWRKey),
      [balanceSWRKey]
    );

    const toDisplayRef = useRef<HTMLDivElement>(null);
    const [displayed, setDisplayed] = useState(balanceAlreadyLoaded);

    // const preservedBalance = useMemo(() => {
    //   if (!metadata || !latestBalance) return;
    //   return new BigNumber(latestBalance).div(10 ** metadata.decimals);
    // }, [latestBalance, metadata]);

    useEffect(() => {
      const el = toDisplayRef.current;
      if (!displayed && "IntersectionObserver" in window && el) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setDisplayed(true);
            }
          },
          { rootMargin: "0px" }
        );

        observer.observe(el);
        return () => {
          observer.unobserve(el);
        };
      }
      return;
    }, [displayed, setDisplayed]);

    const renderBalance = useCallback(
      (balance: BigNumber) => (
        <div className="flex items-center">
          <span className="text-base font-normal text-gray-700">
            <Money>{balance}</Money>{" "}
            <span className="opacity-90" style={{ fontSize: "0.75em" }}>
              {getAssetSymbol(metadata)}
            </span>
          </span>

          <InUSD assetSlug={assetSlug} volume={balance}>
            {(usdBalance) => (
              <div
                className={classNames(
                  "ml-2",
                  "text-sm font-light text-gray-600"
                )}
              >
                ${usdBalance}
              </div>
            )}
          </InUSD>
        </div>
      ),
      [assetSlug, metadata]
    );

    return (
      <Link
        to={toExploreAssetLink(assetSlug)}
        className={classNames(
          "relative",
          "block w-full",
          "overflow-hidden",
          !last && "border-b border-gray-200",
          active ? "bg-gray-100" : "hover:bg-gray-100 focus:bg-gray-100",
          "flex items-center py-2 px-3",
          "text-gray-700",
          "transition ease-in-out duration-200",
          "focus:outline-none"
        )}
        testID={AssetsSelectors.AssetItemButton}
        testIDProperties={{ key: assetSlug }}
      >
        <AssetIcon
          assetSlug={assetSlug}
          size={32}
          className="mr-3 flex-shrink-0"
        />

        <div ref={toDisplayRef} className="flex items-center">
          <div className="flex flex-col">
            {/* {preservedBalance ? (
              renderBalance(preservedBalance)
            ) : (
              <Balance
                address={accountPkh}
                assetSlug={assetSlug}
                displayed={displayed}
              >
                {renderBalance}
              </Balance>
            )} */}

            <Balance
              address={accountPkh}
              assetSlug={assetSlug}
              displayed={displayed}
            >
              {renderBalance}
            </Balance>

            <div className={classNames("text-xs font-light text-gray-600")}>
              {getAssetName(metadata)}
            </div>
          </div>
        </div>

        <div
          className={classNames(
            "absolute right-0 top-0 bottom-0",
            "flex items-center",
            "pr-2",
            "text-gray-500"
          )}
        >
          <ChevronRightIcon className="h-5 w-auto stroke-current" />
        </div>
      </Link>
    );
  }
);

function toExploreAssetLink(key: string) {
  return `/explore/${key}`;
}
