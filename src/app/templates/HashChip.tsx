import React, { ComponentProps, FC, HTMLAttributes } from "react";

import CopyButton from "app/atoms/CopyButton";
import HashShortView from "app/atoms/HashShortView";

type HashChipProps = HTMLAttributes<HTMLButtonElement> &
  ComponentProps<typeof HashShortView> & {
    small?: boolean;
    type?: "button" | "link";
  };

const HashChip: FC<HashChipProps> = ({
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
