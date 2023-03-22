import React, { FC, memo, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector, usePartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

import Spinner from './Spinner/Spinner';

export enum PartnersPromotionVariant {
  Text = 'Text',
  Image = 'Image'
}

interface Props {
  variant: PartnersPromotionVariant;
}

export const PartnersPromotion: FC<Props> = memo(({ variant }) => {
  const confirm = useConfirm();
  const dispatch = useDispatch();

  const { data: promo, isLoading, error } = usePartnersPromoSelector();
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  const handleClosePartnersPromoClick = useCallback(async () => {
    const confirmed = await confirm({
      title: t('closePartnersPromotion'),
      children: t('closePartnersPromoConfirm'),
      comfirmButtonText: t('disable')
    });

    if (!confirmed) {
      return;
    }

    dispatch(togglePartnersPromotionAction(false));
  }, [confirm]);

  if (!shouldShowPartnersPromo || Boolean(error)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center rounded-lg max-w-sm bg-gray-100" style={{ height: 112 }}>
        <Spinner className="w-16 h-4" theme="gray" />
      </div>
    );
  }

  if (variant === PartnersPromotionVariant.Text) {
    return (
      <div className="relative bg-gray-100">
        <a
          className="flex items-start justify-start gap-2 p-4 max-w-sm w-full"
          href="https://templewallet.com/"
          target="_blank"
          rel="noreferrer"
        >
          <img
            className="h-10 w-10 rounded-circle"
            src={'https://cdn-icons-png.flaticon.com/512/7016/7016544.png'}
            alt="Partners promotion"
          />
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <span className="color-gray-910 font-medium">{promo.copy.headline}</span>
              <div className="flex items-center px-1 rounded bg-blue-500 text-xs font-medium text-white">AD</div>
            </div>
            <span>{promo.copy.content}</span>
          </div>
        </a>
        <button
          className="absolute top-2 right-2 z-10 p-1 border-gray-300 border rounded"
          onClick={handleClosePartnersPromoClick}
        >
          <CloseIcon className="w-auto h-4" style={{ stroke: '#718096', strokeWidth: 2 }} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex rounded-lg max-w-sm" style={{ height: 112 }}>
      <div className="absolute px-3 rounded-tl-lg rounded-br-lg bg-blue-500 text-sm font-semibold text-white">AD</div>
      <button
        className="absolute top-2 right-4 h-6 w-6 z-10 bg-blue-500 rounded-circle"
        onClick={handleClosePartnersPromoClick}
      >
        <CloseIcon className="w-4 h-4 m-auto" style={{ strokeWidth: 3 }} />
      </button>
      <a href={promo.link} target="_blank" rel="noreferrer">
        <img src={promo.image} alt="Partners promotion" className="shadow-lg rounded-lg" />
      </a>
    </div>
  );
});
