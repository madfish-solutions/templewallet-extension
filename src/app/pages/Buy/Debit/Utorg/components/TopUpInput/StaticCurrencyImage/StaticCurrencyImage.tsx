import React, { FC, useMemo, useState } from 'react';

import { browser } from 'webextension-polyfill-ts';

const MOONPAY_FIAT_ICONS_BASE_URL = 'https://static.moonpay.com/widget/currencies/';

interface Props {
  currencyName: string;
  style?: React.CSSProperties;
}

export const StaticCurrencyImage: FC<Props> = ({ currencyName, style = {} }) => {
  const [isFailed, setIsFailed] = useState(false);
  const imageSrc = useMemo(() => {
    switch (currencyName) {
      case 'XTZ':
        return browser.runtime.getURL('misc/token-logos/tez.svg');
      case 'UAH':
        return browser.runtime.getURL('misc/fiat-logos/uah.svg');
      default:
        return MOONPAY_FIAT_ICONS_BASE_URL + currencyName.toLowerCase() + '.svg';
    }
  }, [currencyName]);

  const conditionalStyle = useMemo(() => ({ display: isFailed ? 'none' : 'flex' }), [isFailed]);

  return (
    <>
      <img
        alt="currencyImage"
        style={{ ...style, ...conditionalStyle }}
        src={imageSrc}
        onLoad={() => setIsFailed(false)}
        onError={() => setIsFailed(true)}
      />
      {isFailed && (
        <img alt="fallbackIcon" style={style} src={browser.runtime.getURL('misc/token-logos/fallback.svg')} />
      )}
    </>
  );
};
