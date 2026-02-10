import React, { FC, memo } from 'react';

import { Button } from 'app/atoms';

import { ReactComponent as KoloLogo } from './assets/kolo-logo.svg';
import { KoloCardSelectors } from './selectors';

interface KoloCryptoCardPreviewProps {
  onClick?: EmptyFn;
}

export const KoloCryptoCardPreview: FC<KoloCryptoCardPreviewProps> = memo(({ onClick }) => (
  <Button
    onClick={onClick}
    testID={KoloCardSelectors.cryptoCardButton}
    className="peer rounded-8 h-24 mx-6 -mb-[68px] px-4 py-3 flex items-start justify-between
               focus:outline-hidden transform transition-transform duration-200 ease-out origin-left hover:-rotate-1"
    style={{
      background: 'linear-gradient(136deg, #FF5B00 -2.06%, #F4BE38 103.52%)'
    }}
  >
    <span className="text-font-description-bold text-white text-left">Crypto card</span>

    <KoloLogo />
  </Button>
));
