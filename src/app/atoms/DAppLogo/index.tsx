import React, { CSSProperties, memo, useMemo } from 'react';

import clsx from 'clsx';

import { ImageStacked } from 'lib/ui/ImageStacked';

import { IconBase } from '../IconBase';

import { ReactComponent as PlugSvg } from './plug.svg';

interface DAppLogoProps {
  origin: string;
  size: number;
  className?: string;
  icon?: string;
  style?: CSSProperties;
}

const DAppLogo = memo<DAppLogoProps>(({ origin, size, icon, className, style }) => {
  const faviconSrc = useMemo(() => [icon ? icon : `${origin}/favicon.ico`], [origin, icon]);

  const styleMemo = useMemo(() => ({ width: size, height: size, ...style }), [style, size]);

  const placeholder = (
    <div className={clsx('flex items-center bg-grey-4', className)} style={styleMemo}>
      <IconBase Icon={PlugSvg} size={16} className="mx-auto text-grey-1" />
    </div>
  );

  return (
    <ImageStacked
      sources={faviconSrc}
      alt={origin}
      style={styleMemo}
      className={className}
      loader={placeholder}
      fallback={placeholder}
    />
  );
});

export default DAppLogo;
