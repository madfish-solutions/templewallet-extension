import React, { FC } from 'react';

import { useDispatch } from 'react-redux';

import { ReactComponent as CloseIcon } from 'app/icons/close.svg';
import { skipPartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useSeenPartnersPromoIdsSelector, usePartnersPromoSelector } from 'app/store/partners-promotion/selectors';

export const PartnersPromotion: FC = () => {
  const dispatch = useDispatch();
  const { id, image, link } = usePartnersPromoSelector();
  const seenPartnersPromoIds = useSeenPartnersPromoIdsSelector();

  if (seenPartnersPromoIds.includes(id)) {
    return null;
  }

  return (
    <div className="relative flex z-0 rounded-lg" style={{ width: 352 }}>
      <div className="absolute px-3 rounded-tl-lg rounded-br-lg bg-blue-500 text-sm font-semibold text-white">AD</div>
      <button
        className="absolute top-2 right-4 z-10 p-1 bg-blue-500"
        style={{ borderRadius: '50%' }}
        onClick={() => dispatch(skipPartnersPromotionAction(id))}
      >
        <CloseIcon className="w-auto h-5" style={{ strokeWidth: 2 }} />
      </button>
      <a href={link} target="_blank" rel="noreferrer">
        <img src={image} alt="Partners promotion" className="shadow-lg rounded-lg" />
      </a>
    </div>
  );
};
