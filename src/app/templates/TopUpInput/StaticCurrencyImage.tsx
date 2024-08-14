import React, { FC, RefObject, useEffect, useMemo, useRef, useState } from 'react';

import classNames from 'clsx';

import { FIAT_FALLBACK_ICON_SRC, TOKEN_FALLBACK_ICON_SRC, TOKENS_ICONS_SRC } from 'lib/icons';
import { useIntersectionObserver } from 'lib/ui/use-intersection-observer';

const ROUNDING_STYLE = { borderRadius: '50%', width: 32, height: 32 };

interface Props {
  currencyCode: string;
  isFiat?: boolean;
  imageSrc?: string;
  fitImg?: boolean;
  className?: string;
  scrollableRef?: RefObject<HTMLDivElement>;
}

export const StaticCurrencyImage: FC<Props> = ({
  currencyCode,
  isFiat,
  imageSrc,
  fitImg,
  className,
  scrollableRef
}) => {
  const [isFailed, setIsFailed] = useState(false);

  const [isVisible, setIsVisible] = useState(!scrollableRef);
  const ref = useRef(null);
  useIntersectionObserver(
    ref,
    entry => setIsVisible(entry.isIntersecting),
    { threshold: 0.5, root: scrollableRef?.current },
    Boolean(scrollableRef)
  );
  const [wasVisible, setWasVisible] = useState(isVisible);

  useEffect(() => void (isVisible && setWasVisible(true)), [isVisible]);

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
        ref={ref}
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
      <div className={classNames('flex justify-center items-center bg-gray-300', className)} style={style} ref={ref}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        {wasVisible && <img {...imgProps} width={21} height={15} />}
      </div>
    );

  return wasVisible ? (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img className={className} {...imgProps} style={style} ref={ref} />
  ) : (
    <div className={className} style={style} ref={ref} />
  );
};
