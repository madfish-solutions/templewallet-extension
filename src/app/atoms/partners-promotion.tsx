import React, { FC, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector, usePartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

export enum PartnersPromotionVariant {
  Text = 'Text',
  Image = 'Image'
}

interface Props {
  variant: PartnersPromotionVariant;
}

export const PartnersPromotion: FC<Props> = ({ variant }) => {
  const confirm = useConfirm();
  const dispatch = useDispatch();

  const {
    image,
    link,
    copy: { headline, content }
  } = usePartnersPromoSelector();
  const shouldShowPartnersPromo = useShouldShowPartnersPromoSelector();

  const handleClosePartnersPromoClick = useCallback(async () => {
    if (
      !(await confirm({
        title: t('closePartnersPromotion'),
        children: t('closePartnersPromoConfirm')
      }))
    ) {
      return;
    }

    dispatch(togglePartnersPromotionAction(false));
  }, [confirm]);

  if (!shouldShowPartnersPromo) {
    return null;
  }

  if (variant === PartnersPromotionVariant.Text) {
    return (
      <div className="relative flex items-start justify-between gap-2 p-4 bg-gray-100">
        <img style={{ height: 32, width: 32, borderRadius: '50%' }} src={image} alt="Partners promotion" />
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <span className="color-gray-910 font-medium">{headline}</span>
            <div className="flex items-center px-1 rounded bg-blue-500 text-xs font-medium text-white">AD</div>
          </div>
          <span>{content}</span>
        </div>
        <button
          className="relative bottom-2 z-10 p-1 border-gray-300 border rounded"
          onClick={handleClosePartnersPromoClick}
        >
          <CloseIcon className="w-auto h-4" style={{ stroke: '#718096', strokeWidth: 2 }} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex z-0 rounded-lg max-w-sm" style={{ height: 112 }}>
      <div className="absolute px-3 rounded-tl-lg rounded-br-lg bg-blue-500 text-sm font-semibold text-white">AD</div>
      <button
        className="absolute top-2 right-4 z-10 p-1 bg-blue-500"
        style={{ borderRadius: '50%' }}
        onClick={handleClosePartnersPromoClick}
      >
        <CloseIcon className="w-auto h-5" style={{ strokeWidth: 2 }} />
      </button>
      <a href={link} target="_blank" rel="noreferrer">
        <img src={image} alt="Partners promotion" className="shadow-lg rounded-lg" />
      </a>
    </div>
  );
};
