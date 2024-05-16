import React, { SVGProps, memo, useMemo } from 'react';

import { ReactComponent as WhiteLogoTitle } from 'app/misc/logo-white-title.svg';
import { ReactComponent as WhiteLogo } from 'app/misc/logo-white.svg';
import { ReactComponent as TempleIconTitleFullV } from 'app/misc/temple-icon-title-full-v.svg';
import { ReactComponent as TempleIconTitleFull } from 'app/misc/temple-icon-title-full.svg';
import { ReactComponent as TempleIconTitle } from 'app/misc/temple-icon-title.svg';
import { ReactComponent as TempleIcon } from 'app/misc/temple-icon.svg';
import { APP_TITLE } from 'lib/constants';

type LogoType = 'icon' | 'icon-title' | 'icon-title-full' | 'icon-title-full-v';

interface LogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  type: LogoType;
  white?: boolean;
}

const logoIcons = {
  icon: {
    standard: TempleIcon,
    white: WhiteLogo
  },
  'icon-title': {
    standard: TempleIconTitle,
    white: WhiteLogoTitle
  },
  'icon-title-full': {
    standard: TempleIconTitleFull,
    // TODO: add white version
    white: TempleIconTitleFull
  },
  'icon-title-full-v': {
    standard: TempleIconTitleFullV,
    white: TempleIconTitleFullV
  }
};

export const Logo = memo<LogoProps>(({ size = 40, type, style: customStyle, white, ...rest }) => {
  const Component = logoIcons[type][white ? 'white' : 'standard'];
  const style = useMemo(() => ({ ...(customStyle ?? {}), height: size }), [customStyle, size]);

  return <Component style={style} title={APP_TITLE} {...rest} />;
});
