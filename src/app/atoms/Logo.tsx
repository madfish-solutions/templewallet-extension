import React, { SVGProps, memo, useMemo } from 'react';

import { ReactComponent as TempleIconTitleFullV } from 'app/misc/temple-icon-title-full-v.svg';
import { ReactComponent as TempleIconTitleFull } from 'app/misc/temple-icon-title-full.svg';
import { ReactComponent as TempleIconTitle } from 'app/misc/temple-icon-title.svg';
import { ReactComponent as TempleIcon } from 'app/misc/temple-icon.svg';
import { APP_TITLE } from 'lib/constants';

type LogoType = 'icon' | 'icon-title' | 'icon-title-full' | 'icon-title-full-v';

interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  type: LogoType;
}

const logoIcons = {
  icon: TempleIcon,
  'icon-title': TempleIconTitle,
  'icon-title-full': TempleIconTitleFull,
  'icon-title-full-v': TempleIconTitleFullV
};

export const Logo = memo<LogoProps>(({ size = 40, type, style: customStyle, ...rest }) => {
  const Component = logoIcons[type];
  const style = useMemo(() => ({ ...(customStyle ?? {}), height: size }), [customStyle, size]);

  return <Component style={style} title={APP_TITLE} {...rest} />;
});
