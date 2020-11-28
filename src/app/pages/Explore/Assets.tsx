import * as React from "react";
import classNames from "clsx";
import { cache } from "swr";
import { Link, navigate } from "lib/woozie";
import { T } from "lib/i18n/react";
import {
  useAssets,
  getAssetKey,
  useAccount,
  useBalanceSWRKey,
  ThanosAsset,
} from "lib/thanos/front";
import Money from "app/atoms/Money";
import CleanButton from "app/atoms/CleanButton";
import AssetIcon from "app/templates/AssetIcon";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import { ReactComponent as EditIcon } from "app/icons/edit.svg";
import { ReactComponent as AddToListIcon } from "app/icons/add-to-list.svg";
import { ReactComponent as SearchIcon } from "app/icons/search.svg";
import { ReactComponent as ChevronRightIcon } from "app/icons/chevron-right.svg";

const Assets: React.FC = () => {
  const account = useAccount();
  const { allAssets } = useAssets();

  const [searchValue, setSearchValue] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);

  const searchValueExist = React.useMemo(() => Boolean(searchValue), [
    searchValue,
  ]);

  const filteredAssets = React.useMemo(() => {
    if (!searchValue) return allAssets;

    const loweredSearchValue = searchValue.toLowerCase();
    return allAssets.filter(
      (a) =>
        a.symbol.toLowerCase().includes(loweredSearchValue) ||
        a.name.toLowerCase().includes(loweredSearchValue)
    );
  }, [allAssets, searchValue]);

  const activeAssetKey = React.useMemo(() => {
    return searchFocused && searchValueExist && filteredAssets[activeIndex]
      ? getAssetKey(filteredAssets[activeIndex])
      : null;
  }, [filteredAssets, searchFocused, searchValueExist, activeIndex]);

  React.useEffect(() => {
    if (activeIndex !== 0 && activeIndex >= filteredAssets.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, filteredAssets.length]);

  const handleSearchFieldFocus = React.useCallback(() => {
    setSearchFocused(true);
  }, [setSearchFocused]);

  const handleSearchFieldBlur = React.useCallback(() => {
    setSearchFocused(false);
  }, [setSearchFocused]);

  React.useEffect(() => {
    if (!activeAssetKey) return;

    const handleKeyup = (evt: KeyboardEvent) => {
      switch (evt.key) {
        case "Enter":
          navigate(toExploreAssetLink(activeAssetKey));
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
    return () => {
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [activeAssetKey, setActiveIndex]);

  return (
    <div className={classNames("w-full max-w-sm mx-auto")}>
      <div className="mt-1 mb-3 w-full flex items-strech">
        <SearchField
          value={searchValue}
          onValueChange={setSearchValue}
          onFocus={handleSearchFieldFocus}
          onBlur={handleSearchFieldBlur}
          // autoFocus={searchValueExist}
        />

        <button
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
          <EditIcon
            className={classNames("mr-1 h-4 w-auto stroke-current stroke-2")}
          />
          <T id="edit" />
        </button>

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
          <AddToListIcon
            className={classNames("mr-1 h-5 w-auto stroke-current stroke-2")}
          />
          Add
        </Link>
      </div>

      {filteredAssets.length > 0 ? (
        <div
          className={classNames(
            "w-full",
            "border rounded-md",
            "flex flex-col",
            "text-gray-700 text-sm leading-tight"
          )}
        >
          {filteredAssets.map((asset, i, arr) => {
            const last = i === arr.length - 1;
            const key = getAssetKey(asset);
            const active = activeAssetKey ? key === activeAssetKey : false;

            return (
              <ListItem
                key={key}
                asset={asset}
                slug={key}
                last={last}
                active={active}
                accountPkh={account.publicKeyHash}
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
            {searchValueExist && (
              <SearchIcon className="w-5 h-auto mr-1 stroke-current" />
            )}

            <span className="">No assets found</span>
          </p>

          <p className={classNames("text-center text-xs font-light")}>
            If you don't see your asset,
            <br />
            try to click <b>Edit</b> or <b>Add</b>.
          </p>
        </div>
      )}
    </div>
  );
};

export default Assets;

type ListItemProps = {
  asset: ThanosAsset;
  slug: string;
  last: boolean;
  active: boolean;
  accountPkh: string;
};

const ListItem = React.memo<ListItemProps>(
  ({ asset, slug, last, active, accountPkh }) => {
    const balanceSWRKey = useBalanceSWRKey(asset, accountPkh);
    const balanceAlreadyLoaded = React.useMemo(() => cache.has(balanceSWRKey), [
      balanceSWRKey,
    ]);

    const toDisplayRef = React.useRef<HTMLDivElement>(null);
    const [displayed, setDisplayed] = React.useState(balanceAlreadyLoaded);

    React.useEffect(() => {
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

    return (
      <Link
        to={toExploreAssetLink(slug)}
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
      >
        <AssetIcon asset={asset} size={32} className="mr-3" />

        <div ref={toDisplayRef} className="flex items-center">
          <div className="flex flex-col">
            <Balance address={accountPkh} asset={asset} displayed={displayed}>
              {(balance) => (
                <div className="flex items-center">
                  <span className="text-base font-normal text-gray-700">
                    <Money>{balance}</Money>{" "}
                    <span
                      className="opacity-90 font-light"
                      style={{ fontSize: "0.75em" }}
                    >
                      {asset.symbol}
                    </span>
                  </span>

                  <InUSD asset={asset} volume={balance}>
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
              )}
            </Balance>

            <div className={classNames("text-xs font-light text-gray-600")}>
              {asset.name}
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

type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  value: string;
  onValueChange: (v: string) => void;
};

const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onValueChange,
  ...rest
}) => {
  const handleChange = React.useCallback(
    (evt) => {
      onValueChange(evt.target.value);
    },
    [onValueChange]
  );

  const handleClean = React.useCallback(() => {
    onValueChange("");
  }, [onValueChange]);

  return (
    <div className={classNames("w-full flex flex-col")}>
      <div className={classNames("relative", "flex items-stretch")}>
        <input
          type="text"
          placeholder="Search assets..."
          className={classNames(
            "appearance-none",
            "w-full",
            "py-2 pl-8 pr-4",
            "bg-gray-100 focus:bg-transparent",
            "border border-transparent",
            "focus:outline-none focus:border-gray-300",
            "transition ease-in-out duration-200",
            "rounded-md",
            "text-gray-700 text-sm leading-tight",
            "placeholder-alphagray"
          )}
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={handleChange}
          {...rest}
        />

        <div
          className={classNames(
            "absolute left-0 top-0 bottom-0",
            "px-2 flex items-center",
            "text-gray-500"
          )}
        >
          <SearchIcon className="h-5 w-auto stroke-current" />
        </div>

        {Boolean(value) && (
          <CleanButton bottomOffset="0.45rem" onClick={handleClean} />
        )}
      </div>
    </div>
  );
};

function toExploreAssetLink(key: string) {
  return `/explore/${key}`;
}
