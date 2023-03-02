import React, { FC } from 'react';

import { useDispatch } from 'react-redux';

import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { skipPartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useIsAvailablePartnersPromoSelector, usePartnersPromoSelector } from 'app/store/partners-promotion/selectors';

export const PartnersPromotion: FC = () => {
  const dispatch = useDispatch();
  const { image, link } = usePartnersPromoSelector();
  const isAvailablePartnersPromo = useIsAvailablePartnersPromoSelector();

  if (isAvailablePartnersPromo) {
    return (
      <div className="relative z-0 rounded-lg max-w-sm">
        <div className="absolute px-3 rounded-tl-lg rounded-br-lg bg-blue-500 text-sm font-semibold text-white">AD</div>
        <button
          className="absolute top-2 right-16 z-10 p-1 bg-blue-500"
          style={{ borderRadius: '50%' }}
          onClick={() => dispatch(skipPartnersPromotionAction())}
        >
          <CloseIcon className="w-auto h-5" style={{ strokeWidth: 2 }} />
        </button>
        <a href={link} target="_blank" rel="noreferrer">
          <img src={image} alt="Partners promotion" className="shadow-lg rounded-lg" />
        </a>
      </div>
    );
  }

  return null;
};
