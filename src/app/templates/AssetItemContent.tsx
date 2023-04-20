import React, { FC } from 'react';

import Money from 'app/atoms/Money';
import Balance from 'app/templates/Balance';
import InFiat from 'app/templates/InFiat';
import { useAccount, useAssetMetadata } from 'lib/temple/front';
import { AssetMetadata, getAssetName, getAssetSymbol } from 'lib/temple/metadata';

interface Props {
  slug: string;
  metadata?: AssetMetadata | null;
}

export const AssetItemContent: FC<Props> = ({ slug, metadata }) => {
  const { publicKeyHash } = useAccount();

  if (metadata) return <AssetItemContentComponent slug={slug} metadata={metadata} publicKeyHash={publicKeyHash} />;

  return <AssetItemContentWithUseMeta slug={slug} publicKeyHash={publicKeyHash} />;
};

interface AssetItemContentWithUseMetaProps {
  slug: string;
  publicKeyHash: string;
}

const AssetItemContentWithUseMeta: FC<AssetItemContentWithUseMetaProps> = ({ slug, publicKeyHash }) => {
  const metadata = useAssetMetadata(slug);

  return <AssetItemContentComponent slug={slug} metadata={metadata} publicKeyHash={publicKeyHash} />;
};

interface AssetItemContentComponentProps extends AssetItemContentWithUseMetaProps {
  metadata?: AssetMetadata | null;
}

const AssetItemContentComponent: FC<AssetItemContentComponentProps> = ({ slug, metadata = null, publicKeyHash }) => (
  <>
    <div className="flex flex-col items-start mr-2 leading-none">
      <span className="text-gray-910 text-lg mb-2">{getAssetSymbol(metadata)}</span>
      <span className="text-gray-600 text-xs">{getAssetName(metadata)}</span>
    </div>

    <div className="flex-1 flex flex-col items-end text-right leading-none">
      <span className="text-gray-910 text-lg mb-2">
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
