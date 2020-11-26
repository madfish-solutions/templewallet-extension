import * as React from "react";
import CopyButton from "app/atoms/CopyButton";
import HashShortView from "app/atoms/HashShortView";

type HashChipProps = React.HTMLAttributes<HTMLButtonElement> &
  React.ComponentProps<typeof HashShortView> & {
    small?: boolean;
    type?: "button" | "link";
  };

const HashChip: React.FC<HashChipProps> = ({
  hash,
  trim,
  trimAfter,
  firstCharsCount,
  lastCharsCount,
  type = "button",
  ...rest
}) => (
  <CopyButton text={hash} type={type} {...rest}>
    <HashShortView
      hash={hash}
      trimAfter={trimAfter}
      firstCharsCount={firstCharsCount}
      lastCharsCount={lastCharsCount}
    />
  </CopyButton>
);

export default HashChip;
