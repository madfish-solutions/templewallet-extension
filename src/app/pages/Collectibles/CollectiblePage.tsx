import React, { FC, useCallback, useMemo } from 'react';

import { isDefined } from '@rnw-community/shared';
import { useDispatch } from 'react-redux';

import { FormSubmitButton, FormSecondaryButton, Spinner, Money, Alert } from 'app/atoms';
import PageLayout from 'app/layouts/PageLayout';
import { loadCollectiblesDetailsActions } from 'app/store/collectibles/actions';
import {
  useAllCollectiblesDetailsLoadingSelector,
  useCollectibleDetailsSelector
} from 'app/store/collectibles/selectors';
import AddressChip from 'app/templates/AddressChip';
import OperationStatus from 'app/templates/OperationStatus';
import { objktCurrencies } from 'lib/apis/objkt';
import { BLOCK_DURATION } from 'lib/fixed-times';
import { t, T } from 'lib/i18n';
import { useAssetMetadata, getAssetName } from 'lib/metadata';
import { useAccount } from 'lib/temple/front';
import { formatTcInfraImgUri } from 'lib/temple/front/image-uri';
import { atomsToTokens } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { useInterval } from 'lib/ui/hooks';
import { Image } from 'lib/ui/Image';
import { navigate } from 'lib/woozie';

import { CollectibleImage } from './CollectibleImage';
import { CollectiblesSelectors } from './selectors';
import { useCollectibleSelling } from './use-collectible-selling.hook';

const DETAILS_SYNC_INTERVAL = 4 * BLOCK_DURATION;

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

  const takableOffer = useMemo(
    () => details?.offers.find(({ buyer_address }) => buyer_address !== publicKeyHash),
    [details, publicKeyHash]
  );

  const {
    isSelling,
    initiateSelling: onSellButtonClick,
    operation,
    operationError
  } = useCollectibleSelling(assetSlug, takableOffer);

  const onSendButtonClick = useCallback(() => navigate(`/send/${assetSlug}`), [assetSlug]);

  const dispatch = useDispatch();
  useInterval(() => void dispatch(loadCollectiblesDetailsActions.submit([assetSlug])), DETAILS_SYNC_INTERVAL, [
    dispatch,
    assetSlug
  ]);

  const displayedOffer = useMemo(() => {
    const highestOffer = details?.offers[0];
    if (!isDefined(highestOffer)) return null;

    const offer = takableOffer ?? highestOffer;

    const buyerIsMe = offer.buyer_address === publicKeyHash;

    const currency = objktCurrencies[offer.currency_id];
    if (!isDefined(currency)) return null;

    const price = atomsToTokens(offer.price, currency.decimals);

    return { price, symbol: currency.symbol, buyerIsMe };
  }, [details?.offers, takableOffer, publicKeyHash]);

  const sellButtonTooltipStr = useMemo(() => {
    if (!displayedOffer) return;
    if (displayedOffer.buyerIsMe) return t('cannotSellToYourself');

    let value = displayedOffer.price.toString();
    if (!accountCanSign) value += ` [${t('selectedAccountCannotSignTx')}]`;

    return value;
  }, [displayedOffer, accountCanSign]);

  return (
    <PageLayout pageTitle={<span className="truncate">{collectibleName}</span>}>
      <div className="flex flex-col gap-y-3 max-w-sm w-full mx-auto pt-2 pb-4">
        {operationError ? (
          <Alert
            type="error"
            title={t('error')}
            description={operationError instanceof Error ? operationError.message : `${t('unknownError')}`}
            className="mb-4"
          />
        ) : (
          operation && <OperationStatus typeTitle={t('transaction')} operation={operation} className="mb-4" />
        )}

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
                disabled={!displayedOffer || displayedOffer.buyerIsMe || isSelling || !accountCanSign}
                title={sellButtonTooltipStr}
                onClick={onSellButtonClick}
                testID={CollectiblesSelectors.sellButton}
              >
                {displayedOffer ? (
                  <div>
                    <span>
                      <T id="sellFor" />{' '}
                    </span>
                    <Money shortened smallFractionFont={false} tooltip={false}>
                      {displayedOffer.price}
                    </Money>
                    <span> {displayedOffer.symbol}</span>
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
