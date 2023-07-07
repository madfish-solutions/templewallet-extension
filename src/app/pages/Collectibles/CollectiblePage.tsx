import React, { FC, useMemo } from 'react';

import BigNumber from 'bignumber.js';

import Divider from 'app/atoms/Divider';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useCollectibleInfo } from 'app/hooks/use-collectibles-info.hook';
import PageLayout from 'app/layouts/PageLayout';
import { AssetIcon } from 'app/templates/AssetIcon';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n';
import { useAssetMetadata, getAssetName } from 'lib/metadata';
import { formatTcInfraImgUri } from 'lib/temple/front/image-uri';
import { Image } from 'lib/ui/Image';

import AddressChip from '../Home/OtherComponents/AddressChip';

interface Props {
  assetSlug: string;
}

const CollectiblePage: FC<Props> = ({ assetSlug }) => {
  const [assetContract, assetId] = useMemo(
    () => [fromFa2TokenSlug(assetSlug).contract, new BigNumber(fromFa2TokenSlug(assetSlug).id)],
    [assetSlug]
  );

  const collectibleData = useAssetMetadata(assetSlug);

  const { isLoading, collectibleInfo } = useCollectibleInfo(assetContract, assetId.toString());

  const collectibleName = getAssetName(collectibleData);

  const collectionImage = useMemo(() => formatTcInfraImgUri(collectibleInfo?.fa.logo ?? ''), [collectibleInfo]);

  const collectionName = collectibleInfo?.galleries[0]?.gallery?.name ?? collectibleInfo?.fa.name;

  const creators = collectibleInfo?.creators ?? [];

  return (
    <PageLayout pageTitle={collectibleName}>
      <div className="text-center pb-4 max-w-90 m-auto">
        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <div className="w-full max-w-sm mx-auto">
              <div className="border border-gray-300">
                <AssetIcon assetSlug={assetSlug} />
              </div>
            </div>
            <Divider />
            <div className="flex w-full justify-between items-center mt-4 mb-3">
              <div className="flex items-center justify-center rounded">
                {collectionImage !== undefined && (
                  <Image src={collectionImage} className="w-6 h-6 rounded border border-gray-300" />
                )}
                <div className="content-center ml-2 text-gray-910 text-sm">{collectionName}</div>
              </div>
            </div>
            <div className="flex text-gray-910 text-2xl mb-3">{collectibleName}</div>
            <div className="text-xs text-gray-910 flex mb-3">{collectibleInfo?.description ?? ''}</div>

            {creators.length > 0 && (
              <div className="flex items-center">
                <div className="text-gray-600 text-xs">
                  {collectibleInfo?.creators.length ?? 0 > 1 ? <T id="creators" /> : <T id="creator" />}
                </div>
                <div className="text-xs flex align-text-bottom px-1 py-05 rounded-sm max-w-full">
                  {collectibleInfo?.creators.map(creator => (
                    <AddressChip pkh={creator.holder.address ?? ''} className="mr-1 text-gray-600 bg-gray-100" />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default CollectiblePage;
