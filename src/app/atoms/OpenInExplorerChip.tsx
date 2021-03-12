import classNames from "clsx";
import React from "react";
import useTippy from "lib/ui/useTippy";
import { AnalyticsEventCategory, useAnalytics } from "lib/analytics";
import { ReactComponent as ArrowRightTopIcon } from "app/icons/arrow-right-top.svg";
import { OpenInExplorerChipSelectors } from "./OpenInExplorerChip.selectors";

type OpenInExplorerChipProps = {
  baseUrl: string;
  opHash: string;
  className?: string;
};

const OpenInExplorerChip: React.FC<OpenInExplorerChipProps> = ({
  baseUrl,
  opHash,
  className,
}) => {
  const { trackEvent } = useAnalytics();
  const tippyProps = React.useMemo(
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
    trackEvent(OpenInExplorerChipSelectors.ViewOnBlockExplorerLink, AnalyticsEventCategory.ButtonPress);
  }

  return (
    <a
      ref={ref}
      href={`${baseUrl}/${opHash}`}
      target="_blank"
      rel="noopener noreferrer"
      className={classNames(
        "bg-gray-100 hover:bg-gray-200",
        "rounded-sm shadow-xs",
        "text-xs p-1",
        "text-gray-600 leading-none select-none",
        "transition ease-in-out duration-300",
        "flex items-center",
        className
      )}
      onClick={handleClick}
    >
      <ArrowRightTopIcon className="w-auto h-3 stroke-current stroke-2" />
    </a>
  );
};

export default OpenInExplorerChip;
