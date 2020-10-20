import * as React from "react";
import classNames from "clsx";
import {
  ThanosAsset,
  useAssets,
  useAccount,
  ThanosAssetType,
} from "lib/thanos/front";
import { T } from "lib/i18n/react";
import { getAssetIconUrl } from "app/defaults";
import InUSD from "app/templates/InUSD";
import Money from "app/atoms/Money";
import Balance from "app/templates/Balance";
import IconifiedSelect, {
  IconifiedSelectOptionRenderProps,
} from "app/templates/IconifiedSelect";

type AssetSelectProps = {
  value: ThanosAsset;
  onChange?: (a: ThanosAsset) => void;
  className?: string;
};

const getAssetKey = (asset: ThanosAsset) => asset.symbol;

const AssetSelect: React.FC<AssetSelectProps> = ({
  value,
  onChange,
  className,
}) => {
  const { allAssets } = useAssets();

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
      iconContainerClassName="h-8 w-8"
      Icon={AssetIcon}
      OptionInMenuContent={AssetInMenuContent}
      OptionSelectedContent={AssetSelectedContent}
      getKey={getAssetKey}
      options={allAssets}
      value={value}
      onChange={onChange}
      title={title}
      className={className}
    />
  );
};

export default AssetSelect;

const AssetIcon: React.FC<IconifiedSelectOptionRenderProps<ThanosAsset>> = ({
  option,
}) => (
  <img src={getAssetIconUrl(option)} alt={option.name} className="h-8 w-auto" />
);

const AssetInMenuContent: React.FC<IconifiedSelectOptionRenderProps<
  ThanosAsset
>> = ({ option }) => {
  return option.type === ThanosAssetType.XTZ ? (
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

const AssetSelectedContent: React.FC<IconifiedSelectOptionRenderProps<
  ThanosAsset
>> = ({ option: asset }) => {
  const account = useAccount();

  return (
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
                <div className="mt-1 text-sm text-gray-500">${usdBalance}</div>
              )}
            </InUSD>
          )}
        </div>
      )}
    </Balance>
  );
};
