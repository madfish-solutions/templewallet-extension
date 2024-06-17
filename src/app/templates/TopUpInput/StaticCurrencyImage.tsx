import React, { FC, useMemo, useState } from 'react';

import classNames from 'clsx';

import { FIAT_FALLBACK_ICON_SRC, TOKEN_FALLBACK_ICON_SRC, TOKENS_ICONS_SRC } from 'lib/icons';

const ROUNDING_STYLE = { borderRadius: '50%', width: 32, height: 32 };

interface Props {
  currencyCode: string;
  isFiat?: boolean;
  imageSrc?: string;
  fitImg?: boolean;
  className?: string;
  isVisible?: boolean;
}

export const StaticCurrencyImage: FC<Props> = ({
  currencyCode,
  isFiat,
  imageSrc,
  fitImg,
  className,
  isVisible = true
}) => {
  const [isFailed, setIsFailed] = useState(false);

  const conditionalStyle = useMemo(() => ({ display: isFailed ? 'none' : undefined }), [isFailed]);

  const isTez = currencyCode === 'TEZ' || currencyCode === 'XTZ';

  const src = isTez ? TOKENS_ICONS_SRC.TEZ : imageSrc;

  if (isFailed || !src)
    return (
      <img
        src={isFiat ? FIAT_FALLBACK_ICON_SRC : TOKEN_FALLBACK_ICON_SRC}
        alt={currencyCode}
        className={className}
        style={ROUNDING_STYLE}
      />
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
      <div className={classNames('flex justify-center items-center bg-gray-300', className)} style={style}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {isVisible && <img {...imgProps} width={21} height={15} />}
      </div>
    );

  return isVisible ? (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img className={className} {...imgProps} style={style} />
  ) : (
    <div className={className} style={style} />
  );
};
