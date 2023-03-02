import React, { FC } from 'react';

import Money from 'app/atoms/Money';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { useAccount, useAssetMetadata } from 'lib/temple/front';
import { AssetMetadata, getAssetName, getAssetSymbol } from 'lib/temple/metadata';

interface AssetItemContentProps {
  slug: string;
  metadata?: AssetMetadata | null;
}

export const AssetItemContent: FC<AssetItemContentProps> = ({ slug, metadata }) => {
  const { publicKeyHash } = useAccount();

  if (metadata) return <AssetItemContentWithNoMeta slug={slug} metadata={metadata} publicKeyHash={publicKeyHash} />;

  return <AssetItemContentWithoutMeta slug={slug} publicKeyHash={publicKeyHash} />;
};

interface AssetItemContentWithMetaProps {
  slug: string;
  publicKeyHash: string;
}

const AssetItemContentWithoutMeta: FC<AssetItemContentWithMetaProps> = ({ slug, publicKeyHash }) => {
  const metadata = useAssetMetadata(slug);

  return <AssetItemContentWithNoMeta slug={slug} metadata={metadata} publicKeyHash={publicKeyHash} />;
};

interface AssetItemContentWithNoMetaProps extends AssetItemContentWithMetaProps {
  metadata?: AssetMetadata | null;
}

const AssetItemContentWithNoMeta: FC<AssetItemContentWithNoMetaProps> = ({ slug, metadata = null, publicKeyHash }) => (
  <>
    <div className="flex flex-col items-start mr-2">
      <span className="text-gray-910 text-lg">{getAssetSymbol(metadata)}</span>
      <span className="text-gray-600 text-xs">{getAssetName(metadata)}</span>
    </div>

    <div className="flex-1 flex flex-col items-end text-right">
      <span className="text-gray-910 text-lg">
        <Balance assetSlug={slug} address={publicKeyHash}>
          {balance => (
            <Money smallFractionFont={false} tooltip={false}>
              {balance}
            </Money>
          )}
        </Balance>
      </span>

      <span className="text-xs text-gray-600">
        <Balance assetSlug={slug} address={publicKeyHash}>
          {volume => (
            <InFiat assetSlug={slug} volume={volume} smallFractionFont={false}>
              {({ balance, symbol }) => (
                <>
                  <span className="mr-1">≈</span>
                  {balance}
                  <span className="ml-1">{symbol}</span>
                </>
              )}
            </InFiat>
          )}
        </Balance>
      </span>
    </div>
  </>
);
