import React, { CSSProperties, memo, SVGProps } from "react";

import { ReactComponent as LogoTitle } from "app/misc/logo-title.svg";
import { ReactComponent as WhiteLogoTitle } from "app/misc/logo-white-title.svg";
import { ReactComponent as WhiteLogo } from "app/misc/logo-white.svg";
import { ReactComponent as PlainLogo } from "app/misc/logo.svg";

type LogoProps = SVGProps<SVGSVGElement> & {
  hasTitle?: boolean;
  white?: boolean;
  style?: CSSProperties;
};

const Logo = memo<LogoProps>(
  ({ hasTitle, white, style = {}, ...rest }) => {
    const Component = white
      ? hasTitle
        ? WhiteLogoTitle
        : WhiteLogo
      : hasTitle
      ? LogoTitle
      : PlainLogo;

    return (
      <Component
        title="Temple - Tezos Wallet"
        style={{
          height: 40,
          width: "auto",
          marginTop: 6,
          marginBottom: 6,
          ...style,
        }}
        {...rest}
      />
    );
  }
);

export default Logo;
