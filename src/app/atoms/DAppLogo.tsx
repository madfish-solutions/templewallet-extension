import React, { CSSProperties, memo, useMemo } from 'react';

import { Identicon } from 'app/atoms';
import { ImageStacked } from 'lib/ui/ImageStacked';

interface DAppLogoProps {
  origin: string;
  size: number;
  className?: string;
  icon?: string;
  style?: CSSProperties;
}

const DAppLogo = memo<DAppLogoProps>(({ origin, size, icon, className, style }) => {
  const faviconSrc = useMemo(() => [icon ? icon : `${origin}/favicon.ico`], [origin, icon]);

  const placeholder = <Identicon type="jdenticon" hash={origin} size={size} className={className} style={style} />;

  return (
    <ImageStacked
      sources={faviconSrc}
      alt={origin}
      style={{ width: size, height: size, ...style }}
      className={className}
      loader={placeholder}
      fallback={placeholder}
    />
  );
});

export default DAppLogo;
