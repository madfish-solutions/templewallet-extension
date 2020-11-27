import * as React from "react";
import classNames from "clsx";
import { cache } from "swr";
import { Link } from "lib/woozie";
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

  return (
    <div className={classNames("w-full max-w-sm mx-auto")}>
      <div className="mt-1 mb-3 w-full flex items-strech">
        <SearchField />

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

      <div
        className={classNames(
          "w-full",
          "border rounded-md",
          "flex flex-col",
          "text-gray-700 text-sm leading-tight"
        )}
      >
        {allAssets.map((asset, i, arr) => {
          const last = i === arr.length - 1;
          const key = getAssetKey(asset);

          return (
            <ListItem
              key={key}
              asset={asset}
              slug={key}
              last={last}
              accountPkh={account.publicKeyHash}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Assets;

type ListItemProps = {
  asset: ThanosAsset;
  slug: string;
  last: boolean;
  accountPkh: string;
};

const ListItem = React.memo<ListItemProps>(
  ({ asset, slug, last, accountPkh }) => {
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
        to={`/explore/${slug}`}
        className={classNames(
          "relative",
          "block w-full",
          "overflow-hidden",
          !last && "border-b border-gray-200",
          "hover:bg-gray-100 focus:bg-gray-100",
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

const SearchField: React.FC = () => {
  const [value, setValue] = React.useState("");

  const handleChange = React.useCallback(
    (evt) => {
      setValue(evt.target.value);
    },
    [setValue]
  );

  const handleClean = React.useCallback(() => {
    setValue("");
  }, [setValue]);

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
