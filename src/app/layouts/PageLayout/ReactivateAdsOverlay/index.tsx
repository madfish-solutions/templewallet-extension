import React, { CSSProperties, FC, memo, ReactNode } from 'react';

import clsx from 'clsx';

import { Button } from 'app/atoms';
import { useAppEnv } from 'app/env';
import { ReactComponent as ExIcon } from 'app/icons/x.svg';
import ContentContainer from 'app/layouts/ContentContainer';
import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { setPendingReactivateAdsAction } from 'app/store/settings/actions';
import { useIsPendingReactivateAdsSelector } from 'app/store/settings/selectors';
import { EmojiInlineIcon } from 'lib/icons/emoji';

import bgPopupImgSrc from './bg-popup.png';
import bgImgSrc from './bg.png';
import { ReactComponent as CloseAdIcon } from './close-ad.svg';
import { ReactivateAdsOverlaySelectors } from './selectors';
import tkeyImgSrc from './tkey.png';

export const ReactivateAdsOverlay = memo(() => {
  const { popup } = useAppEnv();

  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();
  const isPendingReactivateAds = useIsPendingReactivateAdsSelector();

  const close = () => void dispatch(setPendingReactivateAdsAction(false));

  const reactivate = () => {
    dispatch(togglePartnersPromotionAction(true));
    dispatch(setPendingReactivateAdsAction(false));
  };

  if (shouldShowPartnersPromo || !isPendingReactivateAds) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gray-700 bg-opacity-20">
      <ContentContainer className={clsx('overflow-y-scroll py-4', popup ? 'h-full px-4' : 'px-5')} padding={false}>
        <div
          className={clsx(
            'relative flex flex-col bg-white shadow-lg rounded-md overflow-x-hidden',
            popup ? 'h-full pt-14 pb-6' : 'items-center px-8 pt-11 pb-6'
          )}
        >
          <Button
            type="button"
            className="absolute top-3 right-3 p-2 flex items-center bg-gray-200 rounded hover:opacity-90"
            onClick={close}
            testID={ReactivateAdsOverlaySelectors.closeButton}
          >
            <ExIcon className="h-4 w-4 text-gray-600 stroke-current" />
          </Button>

          <div className="relative px-6">
            <img
              src={popup ? bgPopupImgSrc : bgImgSrc}
              alt="bg"
              className={clsx('absolute', popup ? 'w-full' : 'left-1/2 top-9 h-96')}
              style={popup ? { left: 0, top: -46 } : { translate: '-50% 0' }}
            />

            <span
              className="relative text-orange-500 font-bold text-center"
              style={{ fontSize: popup ? 36 : 58, lineHeight: 1.2 }}
            >
              Use Wallet and Earn TKEY
            </span>

            <img
              src={tkeyImgSrc}
              alt="tkey"
              className="absolute h-60"
              style={
                popup
                  ? { left: -40, top: 'calc(100% + 32px)' }
                  : { left: 'calc(50% + 2px)', translate: '-50% 0', top: 106 }
              }
            />
          </div>

          <div
            className={clsx(
              'self-stretch flex-grow flex flex-col items-end',
              popup ? 'mt-11 pr-8 gap-y-10' : 'mt-3 mb-9'
            )}
          >
            <MotivationPoint
              position={1}
              popup={popup}
              title="Act With Temple"
              description={`Receive or send tokens, swap
                and explore blockchain.`}
            />

            <MotivationPoint
              position={2}
              popup={popup}
              title={
                <>
                  Watch Ads <EmojiInlineIcon name="heart-eyes-1f60d" />
                </>
              }
              description={`Familiar experience, now with
                growth of TKEY balance.`}
            />

            <MotivationPoint
              position={3}
              popup={popup}
              title={
                <>
                  Enjoy The Rewards <EmojiInlineIcon name="smirk-1f60f" />
                </>
              }
              description={`Up to 70,000 TKEY dropped to users.
                Join the next distribution!`}
            />
          </div>

          <Button
            type="button"
            className={clsx(
              'relative h-12 flex items-center justify-center font-semibold rounded-md text-base px-4 py-3 bg-orange-500 text-white',
              popup ? 'mx-6' : 'w-80'
            )}
            onClick={reactivate}
            testID={ReactivateAdsOverlaySelectors.reactivateButton}
          >
            Earn Rewards with Ads
          </Button>

          <p className="mt-3 text-center text-gray-600 text-xxxs leading-4 whitespace-pre-line">
            By participating you agree to share your wallet address{popup ? '\n' : ' '}and IP{popup ? ' ' : '\n'}to
            receive ads and rewards in TKEY token
          </p>
        </div>
      </ContentContainer>
    </div>
  );
});

interface MotivationPointProps {
  title: ReactNode;
  description: string;
  position: 1 | 2 | 3;
  popup: boolean;
}

const MotivationPoint: FC<MotivationPointProps> = ({ title, description, position, popup }) => {
  const middle = position === 2;

  let className = clsx(
    'relative overflow-hidden flex flex-col gap-y-1 px-6 whitespace-pre-line bg-blue-150',
    middle ? 'pt-6 pb-4' : 'py-4'
  );

  if (position === 1) className += popup ? ' mr-5' : ' self-start';
  else if (position === 3) className += popup ? ' mr-9' : ' self-center';

  const style: CSSProperties = { borderRadius: 10 };
  if (middle) {
    if (popup) style.minWidth = 156;
    else style.margin = '-33px 0 26px';
  }

  return (
    <div className={className} style={style}>
      {middle && (
        <div
          className="absolute top-0 left-0 px-3 font-semibold bg-blue-500 text-blue-150"
          style={{ fontSize: 13, lineHeight: '18px', borderBottomRightRadius: 10 }}
        >
          AD
        </div>
      )}

      {middle && (
        <div className="absolute top-1.5 right-1.5 p-1 rounded-full bg-blue-500">
          <CloseAdIcon className="h-2 w-2 text-blue-150 fill-current stroke-current" />
        </div>
      )}

      <span className={clsx('text-sm leading-none text-blue-500 font-bold', popup && 'text-center')}>{title}</span>

      {!popup && <p className="text-xxxs leading-3 text-blue-750">{description}</p>}
    </div>
  );
};
