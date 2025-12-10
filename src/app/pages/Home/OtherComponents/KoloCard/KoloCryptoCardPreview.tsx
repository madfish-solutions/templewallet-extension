import React, { FC, memo } from 'react';

import { ReactComponent as KoloLogo } from './assets/kolo-logo.svg';

interface KoloCryptoCardPreviewProps {
  onClick?: () => void;
}

export const KoloCryptoCardPreview: FC<KoloCryptoCardPreviewProps> = memo(({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="peer rounded-8 h-24 mx-6 -mb-[68px] px-4 py-3 flex items-start justify-between
               cursor-pointer focus:outline-none transform transition-transform
               duration-200 ease-out origin-left hover:-rotate-1"
    style={{
      background: 'linear-gradient(136deg, #FF5B00 -2.06%, #F4BE38 103.52%)'
    }}
  >
    <span className="text-font-description-bold text-white text-left">Crypto card</span>

    <span>
      <KoloLogo />
    </span>
  </button>
));
