import React, { FC } from 'react';

import classNames from 'clsx';

import { ReactComponent as AliceBobIcon } from 'app/icons/alice-bob.svg';
import { ReactComponent as BinanceConnectIcon } from 'app/icons/binance.svg';
import { ReactComponent as MoonPayIcon } from 'app/icons/moonpay.svg';
import { ReactComponent as PartnersLogo } from 'app/icons/partners-logo.svg';
import { ReactComponent as UtorgIcon } from 'app/icons/utorg.svg';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { isDefined } from 'lib/utils/is-defined';

interface TopUpProviderIconProps {
  providerId?: TopUpProviderId;
  className?: string;
}

const providersIcons: Record<TopUpProviderId, ImportedSVGComponent> = {
  [TopUpProviderId.MoonPay]: MoonPayIcon,
  [TopUpProviderId.Utorg]: UtorgIcon,
  [TopUpProviderId.AliceBob]: AliceBobIcon,
  [TopUpProviderId.BinanceConnect]: BinanceConnectIcon
};

export const TopUpProviderIcon: FC<TopUpProviderIconProps> = ({ providerId, className }) => {
  const Icon = isDefined(providerId) ? providersIcons[providerId] : PartnersLogo;

  return (
    <div className={classNames('p-1.5 border border-gray-300 rounded-lg', className)}>
      <Icon className="w-8 h-8" />
    </div>
  );
};
