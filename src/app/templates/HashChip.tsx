import React, { ComponentProps, FC, HTMLAttributes } from "react";

import CopyButton, { CopyButtonProps } from "app/atoms/CopyButton";
import HashShortView from "app/atoms/HashShortView";

type HashChipProps = HTMLAttributes<HTMLButtonElement> &
  ComponentProps<typeof HashShortView> &
  Pick<CopyButtonProps, "small" | "type" | "bgShade" | "rounded" | "textShade">;

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
