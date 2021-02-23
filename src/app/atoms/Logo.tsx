import * as React from "react";
import { ReactComponent as PlainLogo } from "app/misc/logo.svg";
import { ReactComponent as LogoTitle } from "app/misc/logo-title.svg";
import { ReactComponent as WhiteLogo } from "app/misc/logo-white.svg";
import { ReactComponent as WhiteLogoTitle } from "app/misc/logo-white-title.svg";

type LogoProps = React.SVGProps<SVGSVGElement> & {
  hasTitle?: boolean;
  white?: boolean;
  style?: React.CSSProperties;
};

const Logo = React.memo<LogoProps>(
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
