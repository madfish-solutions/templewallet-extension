import * as React from "react";
import classNames from "clsx";
import logoUrl from "app/misc/logo.png";

type LogoProps = React.HTMLAttributes<HTMLDivElement> & {
  hasTitle?: boolean;
  dark?: boolean;
  imgStyle?: React.CSSProperties;
};

const Logo: React.FC<LogoProps> = ({
  hasTitle,
  dark,
  className,
  imgStyle = {},
  ...rest
}) => (
  <div className={classNames("flex items-center", className)} {...rest}>
    <img
      src={logoUrl}
      alt="Temple Wallet"
      style={{
        height: 40,
        width: "auto",
        marginTop: 6,
        marginBottom: 6,
        ...imgStyle,
      }}
    />

    {hasTitle && (
      <span
        className={classNames(
          "ml-2",
          "text-xl font-semibold tracking-tight",
          dark ? "text-gray-600" : "text-white"
        )}
      >
        Temple
      </span>
    )}
  </div>
);

export default Logo;
