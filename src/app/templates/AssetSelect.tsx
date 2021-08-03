import React, { FC, useMemo } from "react";

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
  useAccountTokensLazy,
  useAccount,
  TempleAccountType,
  useChainId,
  isTezAsset,
  useAssetMetadata,
  getAssetName,
  getAssetSymbol,
} from "lib/temple/front";

type AssetSelectProps = {
  value: string;
  onChange?: (assetSlug: string) => void;
  className?: string;
};

const AssetSelect: FC<AssetSelectProps> = ({ value, onChange, className }) => {
  const chainId = useChainId(true)!;
  const account = useAccount();
  const address = account.publicKeyHash;

  const { data: tokens } = useAccountTokensLazy(chainId, address);

  const assetSlugs = useMemo(
    () => [
      "tez",
      ...(account.type !== TempleAccountType.ManagedKT && tokens ? tokens : []),
    ],
    [account.type, tokens]
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

  return (
    <IconifiedSelect
      Icon={AssetIcon}
      OptionSelectedIcon={AssetSelectedIcon}
      OptionInMenuContent={AssetInMenuContent}
      OptionSelectedContent={AssetSelectedContent}
      getKey={(slug) => slug}
      options={assetSlugs}
      value={value}
      onChange={onChange}
      title={title}
      className={className}
    />
  );
};

export default AssetSelect;

type AssetSelectOptionRenderProps = IconifiedSelectOptionRenderProps<string>;

const AssetIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <GenericAssetIcon assetSlug={option} className="h-8 w-auto mr-3" size={32} />
);

const AssetSelectedIcon: FC<AssetSelectOptionRenderProps> = ({ option }) => (
  <GenericAssetIcon assetSlug={option} className="h-12 w-auto mr-3" size={48} />
);

const AssetInMenuContent: FC<AssetSelectOptionRenderProps> = ({ option }) => {
  const metadata = useAssetMetadata(option);

  return isTezAsset(option) ? (
    <span className="text-gray-700 text-lg">{getAssetName(metadata)}</span>
  ) : (
    <div className="flex flex-col items-start">
      <span className="text-gray-700 text-sm">{getAssetName(metadata)}</span>

      <span className={classNames("text-gray-500", "text-xs leading-none")}>
        {getAssetSymbol(metadata)}
      </span>
    </div>
  );
};

const AssetSelectedContent: FC<AssetSelectOptionRenderProps> = ({
  option: assetSlug,
}) => {
  const account = useAccount();
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
