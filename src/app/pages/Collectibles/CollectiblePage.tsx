import React, { FC, useEffect, useMemo, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { FormSubmitButton } from 'app/atoms';
import Spinner from 'app/atoms/Spinner/Spinner';
import { ReactComponent as RevealEyeBigSvg } from 'app/icons/reveal-eye-big.svg';
import PageLayout from 'app/layouts/PageLayout';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/collectibles/selectors';
import { useTokenMetadataSelector } from 'app/store/tokens-metadata/selectors';
import AddressChip from 'app/templates/AddressChip';
import { T } from 'lib/i18n';
import { useAssetMetadata, getAssetName } from 'lib/metadata';
import { formatTcInfraImgUri } from 'lib/temple/front/image-uri';
import { Image } from 'lib/ui/Image';
import { navigate } from 'lib/woozie';

import { CollectibleImage } from './CollectibleImage';
import Blur from './CollectibleItemImage/Blur.png';
import { CollectiblesSelectors } from './selectors';

interface Props {
  assetSlug: string;
}

const CollectiblePage: FC<Props> = ({ assetSlug }) => {
  const details = useCollectibleDetailsSelector(assetSlug);

  const [isShowBlur, setIsShowBlur] = useState(details?.isAdultContent);

  useEffect(() => setIsShowBlur(details?.isAdultContent), [details?.isAdultContent]);

  const collectibleData = useTokenMetadataSelector(assetSlug);

  const collectibleName = getAssetName(collectibleData);
  const metadata = useAssetMetadata(assetSlug);

  const isInfoLoading = useAllCollectiblesDetailsLoadingSelector();

  useEffect(() => console.log('details?.isAdultContent: ', details?.isAdultContent), [details?.isAdultContent]);
  useEffect(() => console.log('isInfoLoading: ', isInfoLoading), [isInfoLoading]);
  useEffect(() => console.log('isShowBlur: ', isShowBlur), [isShowBlur]);
  useEffect(() => console.log('metadata: ', metadata), [metadata]);

  const collection = useMemo(
    () =>
      details && {
        title: details.galleries[0]?.title ?? details.fa.name,
        logo: formatTcInfraImgUri(details.fa.logo)
      },
    [details]
  );

  const creators = details?.creators ?? [];

  const handleTapToRevealClick = () => setIsShowBlur(false);

  return (
    <PageLayout pageTitle={collectibleName}>
      <div className="flex flex-col gap-y-3 max-w-sm w-full mx-auto pt-2 pb-4">
        {isInfoLoading && !isDefined(details) ? (
          <Spinner className="self-center w-20" />
        ) : (
          <>
            <div
              className="rounded-lg mb-2 border border-gray-300 bg-blue-50 overflow-hidden"
              style={{ aspectRatio: '1/1' }}
            >
              {isShowBlur ? (
                <button
                  className="relative flex justify-center items-center h-full w-full"
                  onClick={handleTapToRevealClick}
                >
                  <img className="h-full w-full" src={Blur} alt="Adult content" />

                  <div className="absolute z-10 flex flex-col justify-center items-center">
                    <RevealEyeBigSvg className="mb-3" />

                    <span className="text-base text-gray-910 font-semibold">Click to reveal</span>
                  </div>
                </button>
              ) : (
                <CollectibleImage large assetSlug={assetSlug} metadata={metadata} className="h-full w-full" />
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center justify-center rounded">
                <Image src={collection?.logo} className="w-6 h-6 rounded border border-gray-300" />
                <div className="content-center ml-2 text-gray-910 text-sm">{collection?.title ?? ''}</div>
              </div>
            </div>

            <div className="text-gray-910 text-2xl truncate">{collectibleName}</div>

            <div className="text-xs text-gray-910 break-words">{details?.description ?? ''}</div>

            {creators.length > 0 && (
              <div className="flex items-center">
                <div className="self-start leading-6 text-gray-600 text-xs mr-1">
                  <T id={creators.length > 1 ? 'creators' : 'creator'} />
                </div>

                <div className="flex flex-wrap gap-1">
                  {creators.map(creator => (
                    <AddressChip key={creator.address} pkh={creator.address} />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col p-4 gap-y-2 rounded-lg border border-gray-300">
              <FormSubmitButton
                onClick={() => navigate(`/send/${assetSlug}`)}
                testID={CollectiblesSelectors.sendButton}
              >
                <T id="send" />
              </FormSubmitButton>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default CollectiblePage;
