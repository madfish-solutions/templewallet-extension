import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { SliseAd } from '@temple-wallet/slise-embed-react';
import { useDispatch } from 'react-redux';

import { useAppEnv } from 'app/env';
import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { setTestID } from 'lib/analytics';
import { t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

import { PartnersPromotionSelectors } from './partners-promotion.selectors';
import Spinner from './Spinner/Spinner';

export enum PartnersPromotionVariant {
  Text = 'Text',
  Image = 'Image'
}

const POPUP_IMAGE_WIDTH = 328;
const FULL_IMAGE_WIDTH = 384;
const AD_FORMAT_WIDTH = 270;
const AD_FORMAT_HEIGHT = 90;

const requireLocalScript = () => require('lib/slise/slise-ad.embed');

export const PartnersPromotion: FC<{}> = memo(() => {
  const confirm = useConfirm();
  const dispatch = useDispatch();
  const { popup } = useAppEnv();

  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState<boolean>(true);
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();
  const width = popup ? POPUP_IMAGE_WIDTH : FULL_IMAGE_WIDTH;
  const containerStyle = useMemo(
    () => ({ width, height: Math.round((AD_FORMAT_HEIGHT * width) / AD_FORMAT_WIDTH) }),
    [width]
  );
  const sliseAdStyle = useMemo(
    () => ({ width: AD_FORMAT_WIDTH, height: AD_FORMAT_HEIGHT, zoom: width / AD_FORMAT_WIDTH }),
    [width]
  );

  const handleClosePartnersPromoClick = useCallback(async () => {
    const confirmed = await confirm({
      title: t('closePartnersPromotion'),
      children: t('closePartnersPromoConfirm'),
      comfirmButtonText: t('disable')
    });

    if (confirmed) {
      dispatch(togglePartnersPromotionAction(false));
    }
  }, [dispatch, confirm]);

  if (!shouldShowPartnersPromo || Boolean(error)) {
    return null;
  }

  return (
    <div
      className="relative flex rounded-lg max-w-sm w-full overflow-hidden"
      style={containerStyle}
      {...setTestID(PartnersPromotionSelectors.promo)}
    >
      <div className="absolute px-3 rounded-tl-lg rounded-br-lg bg-blue-500 text-sm font-semibold text-white">AD</div>
      <button
        className="absolute top-2 right-4 h-6 w-6 z-10 bg-blue-500 rounded-circle"
        onClick={handleClosePartnersPromoClick}
      >
        <CloseIcon className="w-4 h-4 m-auto" style={{ strokeWidth: 3 }} />
      </button>

      <SliseAd
        requireLocalScript={requireLocalScript}
        onError={setError}
        onLoading={setLoading}
        slotId="temple-extension"
        pub="pub-25"
        format={`${AD_FORMAT_WIDTH}x${AD_FORMAT_HEIGHT}`}
        style={sliseAdStyle}
      />

      {loading && (
        <div
          className="flex justify-center items-center rounded-lg max-w-sm bg-gray-100 absolute top-0 left-0"
          style={containerStyle}
        >
          <Spinner className="w-16 h-4" theme="gray" />
        </div>
      )}
    </div>
  );
});
