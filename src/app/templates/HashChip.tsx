import classNames from "clsx";
import * as React from "react";
import CopyButton, { CopyButtonProps } from "app/atoms/CopyButton";
import HashShortView from "app/atoms/HashShortView";

type HashChipProps = React.HTMLAttributes<HTMLButtonElement> & {
  hash: string;
  trimAfter?: number;
  firstCharsCount?: number;
  lastCharsCount?: number;
  small?: boolean;
  type?: "button" | "link";
};

const HashChip: React.FC<HashChipProps> = ({
  hash,
  trimAfter = 20,
  firstCharsCount = 7,
  lastCharsCount = 4,
  type = "button",
  ...rest
}) => {
  const HashShortViewWrapper = type === "button" ? CopyButton : HashLinkWrapper;

  return (
    <HashShortViewWrapper text={hash} {...rest}>
      <HashShortView
        hash={hash}
        firstCharsCount={firstCharsCount}
        lastCharsCount={lastCharsCount}
      />
    </HashShortViewWrapper>
  );
};

export default HashChip;

const HashLinkWrapper = React.memo<CopyButtonProps>(
  ({ className, children, ...restProps }) => {
    return (
      <span className={classNames(className, "hover:underline")} {...restProps}>
        {children}
      </span>
    );
  }
);
