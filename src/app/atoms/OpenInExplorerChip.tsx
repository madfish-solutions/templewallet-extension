import React, { FC, useMemo } from "react";

import classNames from "clsx";

import { ReactComponent as ArrowRightTopIcon } from "app/icons/arrow-right-top.svg";
import { AnalyticsEventCategory, useAnalytics } from "lib/analytics";
import useTippy from "lib/ui/useTippy";

import { OpenInExplorerChipSelectors } from "./OpenInExplorerChip.selectors";

type OpenInExplorerChipProps = {
  baseUrl: string;
  hash: string;
  className?: string;
  bgShade?: 100 | 200;
  textShade?: 500 | 600 | 700;
  rounded?: "sm" | "base";
};

const OpenInExplorerChip: FC<OpenInExplorerChipProps> = ({
  baseUrl,
  hash,
  className,
  bgShade = 100,
  textShade = 600,
  rounded = "sm",
}) => {
  const { trackEvent } = useAnalytics();
  const tippyProps = useMemo(
    () => ({
      trigger: "mouseenter",
      hideOnClick: false,
      content: "View on block explorer",
      animation: "shift-away-subtle",
    }),
    []
  );

  const ref = useTippy<HTMLAnchorElement>(tippyProps);

  const handleClick = () => {
    trackEvent(
      OpenInExplorerChipSelectors.ViewOnBlockExplorerLink,
      AnalyticsEventCategory.ButtonPress
    );
  };

  return (
    <a
      ref={ref}
      href={`${baseUrl}/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames(
        `bg-gray-${bgShade} hover:bg-gray-${
          bgShade + 100
        } text-gray-${textShade}`,
        rounded === "base" ? "rounded" : `rounded-${rounded}`,
        "leading-none select-none",
        "transition ease-in-out duration-300",
        "flex items-center justify-center",
        className
      )}
      onClick={handleClick}
    >
      <ArrowRightTopIcon className="h-5 w-auto fill-current" />
    </a>
  );
};

export default OpenInExplorerChip;
