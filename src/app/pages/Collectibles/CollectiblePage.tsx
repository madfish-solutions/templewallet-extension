import React, { FC, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import BigNumber from 'bignumber.js';

import { FormSubmitButton } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useCollectibleInfo } from 'app/hooks/use-collectibles-info.hook';
import PageLayout from 'app/layouts/PageLayout';
import { fromFa2TokenSlug } from 'lib/assets/utils';
import { T } from 'lib/i18n';
import { useAssetMetadata, getAssetName } from 'lib/metadata';
import { formatTcInfraImgUri } from 'lib/temple/front/image-uri';
import { Image } from 'lib/ui/Image';
import { navigate } from 'lib/woozie';

import AddressChip from '../Home/OtherComponents/AddressChip';
import { CollectibleImage } from './CollectibleImage';

interface Props {
  assetSlug: string;
}

const CollectiblePage: FC<Props> = ({ assetSlug }) => {
  const [assetContract, assetId] = useMemo(
    () => [fromFa2TokenSlug(assetSlug).contract, new BigNumber(fromFa2TokenSlug(assetSlug).id)],
    [assetSlug]
  );

  const metadata = useAssetMetadata(assetSlug);

  const { isLoading: isInfoLoading, collectibleInfo: info } = useCollectibleInfo(assetContract, assetId.toString());

  const collectibleName = getAssetName(metadata);

  const collectionImage = useMemo(() => formatTcInfraImgUri(info?.fa.logo ?? ''), [info]);

  const collectionName = info?.galleries[0]?.gallery?.name ?? info?.fa.name;

  const creators = info?.creators ?? [];

  return (
    <PageLayout pageTitle={collectibleName}>
      <div className="flex flex-col gap-y-3 max-w-sm w-full mx-auto pt-2 pb-4">
        {isInfoLoading ? (
          <Spinner className="self-center w-20" />
        ) : (
          <>
            <div
              className="rounded-lg mb-2 border border-gray-300 bg-blue-50 overflow-hidden"
              style={{ aspectRatio: '1/1' }}
            >
              <CollectibleImage assetSlug={assetSlug} metadata={metadata} large className="h-full w-full" />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center justify-center rounded">
                {isDefined(collectionImage) && (
                  <Image src={collectionImage} className="w-6 h-6 rounded border border-gray-300" />
                )}
                <div className="content-center ml-2 text-gray-910 text-sm">{collectionName}</div>
              </div>
            </div>

            <div className="text-gray-910 text-2xl truncate">{collectibleName}</div>

            <div className="text-xs text-gray-910 break-words">{info?.description ?? ''}</div>

            {creators.length > 0 && (
              <div className="flex items-center">
                <div className="self-start leading-6 text-gray-600 text-xs mr-1">
                  <T id={creators.length > 1 ? 'creators' : 'creator'} />
                </div>

                <div className="flex flex-wrap gap-1">
                  {creators.map(creator => (
                    <AddressChip key={creator.holder.address} pkh={creator.holder.address} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col p-4 gap-y-2 rounded-lg border border-gray-300">
              <FormSubmitButton onClick={() => navigate(`/send/${assetSlug}`)}>
                <T id={'send'} />
              </FormSubmitButton>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default CollectiblePage;
