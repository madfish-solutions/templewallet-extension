import * as React from "react";
import classNames from "clsx";
import {
  TempleAsset,
  useAssets,
  useAccount,
  TempleAssetType,
  TempleAccountType,
  getAssetKey,
  TEZ_ASSET,
} from "lib/temple/front";
import { T } from "lib/i18n/react";
import InUSD from "app/templates/InUSD";
import GenericAssetIcon from "app/templates/AssetIcon";
import Money from "app/atoms/Money";
import Balance from "app/templates/Balance";
import IconifiedSelect, {
  IconifiedSelectOptionRenderProps,
} from "app/templates/IconifiedSelect";

type AssetSelectProps = {
  value: TempleAsset;
  onChange?: (a: TempleAsset) => void;
  className?: string;
};

const AssetSelect: React.FC<AssetSelectProps> = ({
  value,
  onChange,
  className,
}) => {
  const account = useAccount();
  const { allAssets } = useAssets();
  const relevantAssets = React.useMemo(
    () =>
      account.type === TempleAccountType.ManagedKT ? [TEZ_ASSET] : allAssets,
    [account.type, allAssets]
  );

  const title = React.useMemo(
    () => (
      <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
        <T id="asset">
          {(message) => (
            <span className="text-base font-semibold text-gray-700">
              {message}
            </span>
          )}
        </T>

        <T id="selectAnotherAssetPrompt">
          {(message) => (
            <span
              className={classNames("mt-1", "text-xs font-light text-gray-600")}
              style={{ maxWidth: "90%" }}
            >
              {message}
            </span>
          )}
        </T>
      </h2>
    ),
    []
  );

  return (
    <IconifiedSelect
      Icon={AssetIcon}
      OptionSelectedIcon={AssetSelectedIcon}
      OptionInMenuContent={AssetInMenuContent}
      OptionSelectedContent={AssetSelectedContent}
      getKey={getAssetKey}
      options={relevantAssets}
      value={value}
      onChange={onChange}
      title={title}
      className={className}
    />
  );
};

export default AssetSelect;

type AssetSelectOptionRenderProps = IconifiedSelectOptionRenderProps<TempleAsset>;

const AssetIcon: React.FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <GenericAssetIcon asset={option} className="h-8 w-auto mr-3" size={32} />
);

const AssetSelectedIcon: React.FC<AssetSelectOptionRenderProps> = ({
  option,
}) => (
  <GenericAssetIcon asset={option} className="h-12 w-auto mr-3" size={48} />
);

const AssetInMenuContent: React.FC<AssetSelectOptionRenderProps> = ({
  option,
}) => {
  return option.type === TempleAssetType.TEZ ? (
    <span className="text-gray-700 text-lg">{option.name}</span>
  ) : (
    <div className="flex flex-col items-start">
      <span className="text-gray-700 text-sm">{option.name}</span>

      <span className={classNames("text-gray-500", "text-xs leading-none")}>
        {option.symbol}
      </span>
    </div>
  );
};

const AssetSelectedContent: React.FC<AssetSelectOptionRenderProps> = ({
  option: asset,
}) => {
  const account = useAccount();

  return (
    <Balance asset={asset} address={account.publicKeyHash}>
      {(balance) => (
        <div className="flex flex-col items-start">
          <span className="text-xl text-gray-700">
            <Money>{balance}</Money>{" "}
            <span style={{ fontSize: "0.75em" }}>{asset.symbol}</span>
          </span>

          <InUSD asset={asset} volume={balance}>
            {(usdBalance) => (
              <div className="mt-1 text-sm text-gray-500">${usdBalance}</div>
            )}
          </InUSD>
        </div>
      )}
    </Balance>
  );
};
