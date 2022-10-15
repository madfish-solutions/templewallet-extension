import React, { FC, useMemo, useState } from 'react';

import browser from 'webextension-polyfill';

interface Props {
  currencyCode: string;
  imageSrc: string;
  style?: React.CSSProperties;
}

const EXOLIX_FALLBACK_IMAGE_SRC = 'https://exolix.com/img/crypto.png';

export const StaticCurrencyImage: FC<Props> = ({ currencyCode, imageSrc, style = {} }) => {
  const [isFailed, setIsFailed] = useState(false);

  const conditionalStyle = useMemo(() => ({ display: isFailed ? 'none' : 'flex' }), [isFailed]);

  return (
    <>
      <img
        alt="currencyImage"
        style={{ ...style, ...conditionalStyle }}
        src={currencyCode === 'XTZ' ? browser.runtime.getURL('misc/token-logos/tez.svg') : imageSrc}
        onLoad={() => setIsFailed(false)}
        onError={() => setIsFailed(true)}
      />
      {isFailed && <img alt="fallbackCurrencyImage" style={style} src={EXOLIX_FALLBACK_IMAGE_SRC} />}
    </>
  );
};
