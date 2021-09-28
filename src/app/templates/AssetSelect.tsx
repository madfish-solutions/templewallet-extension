import React, { FC, useCallback, useMemo } from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";

import Money from "app/atoms/Money";
import GenericAssetIcon from "app/templates/AssetIcon";
import Balance from "app/templates/Balance";
import IconifiedSelect, {
  IconifiedSelectOptionRenderProps,
} from "app/templates/IconifiedSelect";
import InUSD from "app/templates/InUSD";
import { T } from "lib/i18n/react";
import {
  useDisplayedFungibleTokens,
  useAccount,
  useChainId,
  useAssetMetadata,
  getAssetName,
  getAssetSymbol,
  useCollectibleTokens,
} from "lib/temple/front";
import * as Repo from "lib/temple/repo";

type AssetSelectProps = {
  value: string;
  onChange?: (assetSlug: string) => void;
  className?: string;
};

type IAsset = Repo.IAccountToken | "tez";

const getSlug = (asset: IAsset) => (asset === "tez" ? asset : asset.tokenSlug);

const AssetSelect: FC<AssetSelectProps> = ({ value, onChange, className }) => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const address = account.publicKeyHash;

  const { data: tokens = [] } = useDisplayedFungibleTokens(chainId, address);
  const { data: collectibles = [] } = useCollectibleTokens(
    chainId,
    address,
    true
  );

  const assets = useMemo<IAsset[]>(
    () => ["tez" as const, ...tokens, ...collectibles],
    [tokens, collectibles]
  );
  const selected = useMemo(
    () => assets.find((a) => getSlug(a) === value) ?? "tez",
    [assets, value]
  );

  const title = useMemo(
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

  const handleChange = useCallback(
    (asset: IAsset) => {
      onChange?.(getSlug(asset));
    },
    [onChange]
  );

  return (
    <IconifiedSelect
      Icon={AssetIcon}
      OptionSelectedIcon={AssetSelectedIcon}
      OptionInMenuContent={AssetInMenuContent}
      OptionSelectedContent={AssetSelectedContent}
      getKey={getSlug}
      options={assets}
      value={selected}
      onChange={handleChange}
      title={title}
      className={className}
    />
  );
};

export default AssetSelect;

type AssetSelectOptionRenderProps = IconifiedSelectOptionRenderProps<IAsset>;

const AssetIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <GenericAssetIcon
    assetSlug={getSlug(option)}
    className="h-8 w-auto mr-3"
    size={32}
  />
);

const AssetSelectedIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <GenericAssetIcon
    assetSlug={getSlug(option)}
    className="h-12 w-auto mr-3"
    size={48}
  />
);

const AssetInMenuContent: FC<AssetSelectOptionRenderProps> = ({
  option: asset,
}) => {
  const account = useAccount();
  const assetSlug = getSlug(asset);
  const metadata = useAssetMetadata(assetSlug);

  return (
    <div className="flex flex-col items-start">
      <span className="text-gray-700 text-sm">{getAssetName(metadata)}</span>

      <span className={classNames("text-gray-600", "text-sm leading-none")}>
        {asset === "tez" ? (
          <Balance assetSlug={assetSlug} address={account.publicKeyHash}>
            {(balance) => (
              <>
                <Money>{balance}</Money>{" "}
                <span className="text-gray-500" style={{ fontSize: "0.75em" }}>
                  {getAssetSymbol(metadata)}
                </span>
              </>
            )}
          </Balance>
        ) : asset?.latestBalance && metadata ? (
          <>
            <Money tooltip={false}>
              {new BigNumber(asset.latestBalance).div(10 ** metadata.decimals)}
            </Money>{" "}
            <span className="text-gray-500" style={{ fontSize: "0.75em" }}>
              {getAssetSymbol(metadata)}
            </span>
          </>
        ) : null}
      </span>
    </div>
  );
};

const AssetSelectedContent: FC<AssetSelectOptionRenderProps> = ({ option }) => {
  const account = useAccount();
  const assetSlug = getSlug(option);
  const metadata = useAssetMetadata(assetSlug);

  return (
    <Balance assetSlug={assetSlug} address={account.publicKeyHash}>
      {(balance) => (
        <div className="flex flex-col items-start">
          <span className="text-xl text-gray-700">
            <Money>{balance}</Money>{" "}
            <span style={{ fontSize: "0.75em" }}>
              {getAssetSymbol(metadata)}
            </span>
          </span>

          <InUSD assetSlug={assetSlug} volume={balance}>
            {(usdBalance) => (
              <div className="mt-1 text-sm text-gray-500">${usdBalance}</div>
            )}
          </InUSD>
        </div>
      )}
    </Balance>
  );
};
