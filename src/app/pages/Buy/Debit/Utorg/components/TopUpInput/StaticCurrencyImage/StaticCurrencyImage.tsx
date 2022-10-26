import React, { FC, useMemo, useState } from 'react';

import browser from 'webextension-polyfill';

const UTORG_FIAT_ICONS_BASE_URL = 'https://utorg.pro/img/flags2/icon-';

interface Props {
  currencyName: string;
  isDefaultUahIcon?: boolean;
  style?: React.CSSProperties;
}

export const StaticCurrencyImage: FC<Props> = ({ currencyName, isDefaultUahIcon, style = {} }) => {
  const [isFailed, setIsFailed] = useState(false);
  const conditionalStyle = useMemo(() => ({ display: isFailed ? 'none' : 'flex' }), [isFailed]);

  return (
    <>
      {currencyName === 'TEZ' || currencyName === 'XTZ' ? (
        <img alt="tezIcon" style={style} src={browser.runtime.getURL('misc/token-logos/tez.svg')} />
      ) : currencyName === 'UAH' && isDefaultUahIcon ? (
        <img alt="tezIcon" style={style} src={browser.runtime.getURL('misc/fiat-logos/uah.svg')} />
      ) : (
        <div className="flex justify-center items-center bg-gray-300" style={{ ...style, ...conditionalStyle }}>
          <img
            alt="currencyImage"
            width={21}
            height={15}
            src={UTORG_FIAT_ICONS_BASE_URL + currencyName.slice(0, -1) + '.svg'}
            onLoad={() => setIsFailed(false)}
            onError={() => setIsFailed(true)}
          />
        </div>
      )}
      {isFailed && (
        <img alt="fallbackIcon" style={style} src={browser.runtime.getURL('misc/token-logos/fallback.svg')} />
      )}
    </>
  );
};
