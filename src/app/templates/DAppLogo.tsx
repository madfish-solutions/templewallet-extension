import React, { CSSProperties, memo, useCallback, useMemo, useState } from 'react';

import classNames from 'clsx';

import { Identicon } from 'app/atoms';

type DAppLogoProps = {
  origin: string;
  size: number;
  className?: string;
  icon?: string;
  style?: CSSProperties;
};

const DAppLogo = memo<DAppLogoProps>(({ origin, size, icon, className, style }) => {
  const faviconSrc = useMemo(() => (icon ? icon : `${origin}/favicon.ico`), [origin, icon]);
  const [faviconShowed, setFaviconShowed] = useState(true);
  const handleFaviconError = useCallback(() => {
    setFaviconShowed(false);
  }, [setFaviconShowed]);

  return faviconShowed ? (
    <div className={classNames('overflow-hidden', className)} style={{ width: size, height: size, ...style }}>
      <img src={faviconSrc} alt={origin} style={{ width: size, height: size }} onError={handleFaviconError} />
    </div>
  ) : (
    <Identicon hash={origin} size={size} className={classNames('shadow-xs', className)} style={style} />
  );
});

export default DAppLogo;
