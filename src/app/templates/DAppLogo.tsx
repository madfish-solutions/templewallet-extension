import classNames from "clsx";
import React from "react";
import Identicon from "app/atoms/Identicon";

type DAppLogoProps = {
  origin: string;
  size: number;
  className?: string;
};

const DAppLogo = React.memo<DAppLogoProps>(({ origin, size, className }) => {
  const faviconSrc = React.useMemo(() => `${origin}/favicon.ico`, [origin]);
  const [faviconShowed, setFaviconShowed] = React.useState(true);
  const handleFaviconError = React.useCallback(() => {
    setFaviconShowed(false);
  }, [setFaviconShowed]);

  return faviconShowed ? (
    <div
      className={classNames("overflow-hidden", className)}
      style={{ width: size, height: size }}
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
    />
  );
});

export default DAppLogo;
