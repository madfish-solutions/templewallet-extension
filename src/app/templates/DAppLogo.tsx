import React, { CSSProperties, memo, useCallback, useMemo, useState } from "react";

import classNames from "clsx";

import Identicon from "app/atoms/Identicon";

type DAppLogoProps = {
  origin: string;
  size: number;
  className?: string;
  style?: CSSProperties;
};

const DAppLogo = memo<DAppLogoProps>(
  ({ origin, size, className, style }) => {
    const faviconSrc = useMemo(() => `${origin}/favicon.ico`, [origin]);
    const [faviconShowed, setFaviconShowed] = useState(true);
    const handleFaviconError = useCallback(() => {
      setFaviconShowed(false);
    }, [setFaviconShowed]);

    return faviconShowed ? (
      <div
        className={classNames("overflow-hidden", className)}
        style={{ width: size, height: size, ...style }}
      >
        <img
          src={faviconSrc}
          alt={origin}
          style={{ width: size, height: size }}
          onError={handleFaviconError}
        />
      </div>
    ) : (
      <Identicon
        hash={origin}
        size={size}
        className={classNames("shadow-xs", className)}
        style={style}
      />
    );
  }
);

export default DAppLogo;
