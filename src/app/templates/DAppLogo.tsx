import classNames from "clsx";
import React from "react";
import Identicon from "app/atoms/Identicon";

type DAppLogoProps = {
  origin: string;
  size: number;
  className?: string;
  style?: React.CSSProperties;
};

const DAppLogo = React.memo<DAppLogoProps>(
  ({ origin, size, className, style }) => {
    const faviconSrc = React.useMemo(() => `${origin}/favicon.ico`, [origin]);
    const [faviconShowed, setFaviconShowed] = React.useState(true);
    const handleFaviconError = React.useCallback(() => {
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
