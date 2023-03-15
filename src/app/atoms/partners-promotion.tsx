import React, { FC, useCallback } from 'react';

import { useDispatch } from 'react-redux';

import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector, usePartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

export const PartnersPromotion: FC = () => {
  const confirm = useConfirm();
  const dispatch = useDispatch();

  const { image, link } = usePartnersPromoSelector();
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

  return (
    <div className="relative flex z-0 rounded-lg max-w-sm" style={{ height: 112 }}>
      <div className="absolute px-3 rounded-tl-lg rounded-br-lg bg-blue-500 text-sm font-semibold text-white">AD</div>
      <button
        className="absolute top-2 right-4 z-10 p-1 bg-blue-500"
        style={{ borderRadius: '50%' }}
        onClick={() => handleClosePartnersPromoClick()}
      >
        <CloseIcon className="w-auto h-5" style={{ strokeWidth: 2 }} />
      </button>
      <a href={link} target="_blank" rel="noreferrer">
        <img src={image} alt="Partners promotion" className="shadow-lg rounded-lg" />
      </a>
    </div>
  );
};
