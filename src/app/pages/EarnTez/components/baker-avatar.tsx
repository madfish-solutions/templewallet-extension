import React, { memo } from 'react';

import clsx from 'clsx';

import { t } from 'lib/i18n';
import { getBakerLogoUrl } from 'lib/temple/front/baking';

import { ReactComponent as UnknownBakerIcon } from './unknown-baker.svg';

interface BakerAvatarProps {
  address?: string;
  bakerName?: string;
  className?: string;
}

export const BakerAvatar = memo<BakerAvatarProps>(({ address, bakerName, className }) =>
  address ? (
    <img
      src={getBakerLogoUrl(address)}
      alt={bakerName ?? t('unknownBakerTitle')}
      className={clsx('flex-shrink-0 w-6 h-6 bg-white rounded', className)}
    />
  ) : (
    <UnknownBakerIcon className={clsx('flex-shrink-0 w-6 h-6', className)} />
  )
);
