import React, { FC, useMemo, useState } from 'react';

import { FIAT_FALLBACK_ICON_SRC, TOKEN_FALLBACK_ICON_SRC, TOKENS_ICONS_SRC } from 'lib/icons';

const ROUNDING_STYLE = { borderRadius: '50%', width: 32, height: 32 };

interface Props {
  currencyCode: string;
  isFiat?: boolean;
  imageSrc?: string;
  fitImg?: boolean;
}

export const StaticCurrencyImage: FC<Props> = ({ currencyCode, isFiat, imageSrc, fitImg }) => {
  const [isFailed, setIsFailed] = useState(false);

  const conditionalStyle = useMemo(() => ({ display: isFailed ? 'none' : undefined }), [isFailed]);

  const isTez = currencyCode === 'TEZ' || currencyCode === 'XTZ';

  const src = isTez ? TOKENS_ICONS_SRC.TEZ : imageSrc;

  if (isFailed || !src)
    return (
      <img alt={currencyCode} style={ROUNDING_STYLE} src={isFiat ? FIAT_FALLBACK_ICON_SRC : TOKEN_FALLBACK_ICON_SRC} />
    );

  const imgProps = {
    alt: currencyCode,
    src,
    onLoad: () => setIsFailed(false),
    onError: () => setIsFailed(true)
  };

  const style = { ...ROUNDING_STYLE, ...conditionalStyle };

  if (fitImg && isTez === false)
    return (
      <div className="flex justify-center items-center bg-gray-300" style={style}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img {...imgProps} width={21} height={15} />
      </div>
    );

  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...imgProps} style={style} />;
};
