import React, { FC, useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';

import { FormSubmitButton, FormSecondaryButton } from 'app/atoms';
import Money from 'app/atoms/Money';
import Spinner from 'app/atoms/Spinner/Spinner';
import PageLayout from 'app/layouts/PageLayout';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/collectibles/selectors';
import AddressChip from 'app/templates/AddressChip';
import { objktCurrencies } from 'lib/apis/objkt';
import { T } from 'lib/i18n';
import { useAssetMetadata, getAssetName } from 'lib/metadata';
import { useAccount } from 'lib/temple/front';
import { formatTcInfraImgUri } from 'lib/temple/front/image-uri';
import { atomsToTokens } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { Image } from 'lib/ui/Image';
import { navigate } from 'lib/woozie';

import { CollectibleImage } from './CollectibleImage';
import { CollectiblesSelectors } from './selectors';
import { useCollectibleSelling } from './use-collectible-selling.hook';

interface Props {
  assetSlug: string;
}

const CollectiblePage: FC<Props> = ({ assetSlug }) => {
  const metadata = useAssetMetadata(assetSlug);
  const account = useAccount();

  const { publicKeyHash } = account;
  const accountCanSign = account.type !== TempleAccountType.WatchOnly;

  const areDetailsLoading = useAllCollectiblesDetailsLoadingSelector();
  const details = useCollectibleDetailsSelector(assetSlug);

  const collectibleName = getAssetName(metadata);

  const collection = useMemo(
    () =>
      details && {
        title: details.galleries[0]?.title ?? details.fa.name,
        logo: formatTcInfraImgUri(details.fa.logo)
      },
    [details]
  );

  const creators = details?.creators ?? [];

  const { isSelling, initiateSelling: onSellButtonClick } = useCollectibleSelling(assetSlug, details);

  const onSendButtonClick = useCallback(() => navigate(`/send/${assetSlug}`), [assetSlug]);

  const offer = useMemo(() => {
    const highestOffer = details?.highestOffer;
    if (!isDefined(highestOffer)) return null;

    const currency = objktCurrencies[highestOffer.currency_id];
    if (!isDefined(currency)) return null;

    const price = atomsToTokens(highestOffer.price, currency.decimals);

    return { price, symbol: currency.symbol, buyerIsMe: highestOffer.buyer_address === publicKeyHash };
  }, [details, publicKeyHash]);

  const sellButtonTooltipStr = useMemo(() => {
    if (!offer) return;
    let value = offer.price.toString();
    if (offer.buyerIsMe) value += ' [Cannot sell to yourself]';
    else if (!accountCanSign) value += " [Won't be able to sign transaction]";

    return value;
  }, [offer, accountCanSign]);

  return (
    <PageLayout pageTitle={collectibleName}>
      <div className="flex flex-col gap-y-3 max-w-sm w-full mx-auto pt-2 pb-4">
        <div
          className="rounded-lg mb-2 border border-gray-300 bg-blue-50 overflow-hidden"
          style={{ aspectRatio: '1/1' }}
        >
          <CollectibleImage assetSlug={assetSlug} metadata={metadata} large className="h-full w-full" />
        </div>

        {areDetailsLoading && !details ? (
          <Spinner className="self-center w-20" />
        ) : (
          <>
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
              <FormSecondaryButton
                disabled={!offer || offer.buyerIsMe || isSelling || !accountCanSign}
                title={sellButtonTooltipStr}
                onClick={onSellButtonClick}
                testID={CollectiblesSelectors.sellButton}
              >
                {offer ? (
                  <div>
                    <span>
                      <T id="sellFor" />{' '}
                    </span>
                    <Money shortened smallFractionFont={false} tooltip={false}>
                      {offer.price}
                    </Money>
                    <span> {offer.symbol}</span>
                  </div>
                ) : (
                  <T id="noOffersYet" />
                )}
              </FormSecondaryButton>

              <FormSubmitButton
                disabled={isSelling}
                onClick={onSendButtonClick}
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
