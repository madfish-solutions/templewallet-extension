import * as React from "react";
import classNames from "clsx";
import { useAppEnv } from "app/env";

type ContentContainerProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: boolean;
};

const ContentContainer: React.FC<ContentContainerProps> = ({
  padding = true,
  className,
  ...rest
}) => {
  const appEnv = useAppEnv();

  return (
    <div
      className={classNames(
        "w-full",
        appEnv.fullPage ? "max-w-screen-md" : "max-w-screen-sm",
        "mx-auto",
        padding && "px-4",
        className
      )}
      {...rest}
    />
  );
};

export default ContentContainer;
