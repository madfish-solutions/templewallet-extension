import React, { memo, MouseEventHandler } from 'react';

import clsx from 'clsx';

import { ReactComponent as CloseAltIcon } from 'app/icons/close-alt.svg';
import { ReactComponent as CloseBoldIcon } from 'app/icons/close-bold.svg';
import { t } from 'lib/i18n';

import { PartnersPromotionVariant } from '../types';

interface CloseButtonProps {
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant: PartnersPromotionVariant;
}

export const CloseButton = memo<CloseButtonProps>(({ className, onClick, variant }) => {
  const isImageAd = variant === PartnersPromotionVariant.Image;

  return (
    <button
      className={clsx(
        'w-4 h-4 flex justify-center items-center',
        isImageAd ? 'bg-blue-500 rounded-circle' : 'border border-gray-300 rounded',
        className
      )}
      onClick={onClick}
      title={t('hideAd')}
    >
      {isImageAd ? (
        <CloseBoldIcon className="w-auto h-4 fill-current text-white" />
      ) : (
        <CloseAltIcon className="w-auto h-3 stroke-current text-gray-600 stroke-1" />
      )}
    </button>
  );
});
