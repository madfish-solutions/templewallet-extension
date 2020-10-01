import * as React from "react";
import classNames from "clsx";
import { Modifier } from "@popperjs/core";
import {
  ThanosAsset,
  useAssets,
  useAccount,
  ThanosAssetType,
} from "lib/thanos/front";
import Popper from "lib/ui/Popper";
import { T } from "lib/ui/i18n";
import { getAssetIconUrl } from "app/defaults";
import InUSD from "app/templates/InUSD";
import DropdownWrapper from "app/atoms/DropdownWrapper";
import Money from "app/atoms/Money";
import { ReactComponent as ChevronDownIcon } from "app/icons/chevron-down.svg";
import Balance from "app/templates/Balance";

type AssetSelectProps = {
  value: ThanosAsset;
  onChange?: (a: ThanosAsset) => void;
  className?: string;
};

const AssetSelect: React.FC<AssetSelectProps> = ({
  value,
  onChange,
  ...rest
}) => {
  const { allAssets } = useAssets();

  return (
    <div {...rest}>
      {allAssets.length > 1 ? (
        <>
          <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
            <T name="asset">
              {(message) => (
                <span className="text-base font-semibold text-gray-700">
                  {message}
                </span>
              )}
            </T>

            <T name="selectAnotherAssetPrompt">
              {(message) => (
                <span
                  className={classNames(
                    "mt-1",
                    "text-xs font-light text-gray-600"
                  )}
                  style={{ maxWidth: "90%" }}
                >
                  {message}
                </span>
              )}
            </T>
          </h2>

          <Popper
            placement="bottom"
            strategy="fixed"
            modifiers={[sameWidth]}
            popup={({ opened, setOpened }) => (
              <DropdownWrapper
                opened={opened}
                hiddenOverflow={false}
                className="origin-top overflow-x-hidden overflow-y-auto"
                style={{
                  maxHeight: "11rem",
                  backgroundColor: "white",
                  borderColor: "#e2e8f0",
                }}
              >
                {allAssets.map((a) => {
                  const selected = value.symbol === a.symbol;

                  return (
                    <button
                      key={a.symbol}
                      type="button"
                      className={classNames(
                        "w-full",
                        "mb-1",
                        "rounded",
                        "transition easy-in-out duration-200",
                        selected ? "bg-gray-200" : "hover:bg-gray-100",
                        "cursor-pointer",
                        "flex items-center"
                      )}
                      style={{
                        padding: "0.375rem 1.5rem 0.375rem 0.5rem",
                      }}
                      autoFocus={selected}
                      onClick={() => {
                        if (onChange && !selected) {
                          onChange(a);
                        }
                        setOpened(false);
                      }}
                    >
                      <img
                        src={getAssetIconUrl(a)}
                        alt={a.name}
                        className="h-8 mr-3 w-auto"
                      />

                      {a.type === ThanosAssetType.XTZ ? (
                        <span className="text-gray-700 text-lg">{a.name}</span>
                      ) : (
                        <div className="flex flex-col items-start">
                          <span className="text-gray-700 text-sm">
                            {a.name}
                          </span>

                          <span
                            className={classNames(
                              "text-gray-500",
                              "text-xs leading-none"
                            )}
                          >
                            {a.symbol}
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </DropdownWrapper>
            )}
          >
            {({ ref, toggleOpened }) => (
              <SelectButton
                ref={ref}
                asset={value}
                dropdown
                onClick={toggleOpened}
              />
            )}
          </Popper>
        </>
      ) : (
        <SelectButton asset={value} />
      )}
    </div>
  );
};

export default AssetSelect;

type SelectButtonProps = React.HTMLAttributes<HTMLButtonElement> & {
  asset: ThanosAsset;
  dropdown?: boolean;
};

const SelectButton = React.forwardRef<HTMLButtonElement, SelectButtonProps>(
  ({ asset, dropdown, className, ...rest }, ref) => {
    const account = useAccount();

    return (
      <button
        ref={ref}
        type="button"
        className={classNames(
          "w-full p-2",
          "border rounded-md",
          "flex items-center",
          dropdown ? "cursor-pointer" : "cursor-default",
          className
        )}
        {...rest}
      >
        <img
          src={getAssetIconUrl(asset)}
          alt={asset.name}
          className="h-12 w-auto mr-3"
        />

        <div className="font-light leading-none">
          <div className="flex items-center">
            <Balance asset={asset} address={account.publicKeyHash}>
              {(balance) => (
                <div className="flex flex-col items-start">
                  <span className="text-xl text-gray-700">
                    <Money>{balance}</Money>{" "}
                    <span style={{ fontSize: "0.75em" }}>{asset.symbol}</span>
                  </span>

                  {asset.type === ThanosAssetType.XTZ && (
                    <InUSD volume={balance}>
                      {(usdBalance) => (
                        <div className="mt-1 text-sm text-gray-500">
                          ${usdBalance}
                        </div>
                      )}
                    </InUSD>
                  )}
                </div>
              )}
            </Balance>
          </div>
        </div>

        {dropdown && (
          <>
            <div className="flex-1" />

            <ChevronDownIcon
              className={classNames(
                "mx-2 h-5 w-auto",
                "text-gray-600",
                "stroke-current stroke-2"
              )}
            />
          </>
        )}
      </button>
    );
  }
);

const sameWidth: Modifier<string, any> = {
  name: "sameWidth",
  enabled: true,
  phase: "beforeWrite",
  requires: ["computeStyles"],
  fn: ({ state }) => {
    state.styles.popper.width = `${state.rects.reference.width}px`;
  },
  effect: ({ state }) => {
    state.elements.popper.style.width = `${
      (state.elements.reference as any).offsetWidth
    }px`;
    return () => {};
  },
};
