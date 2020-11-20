import * as React from "react";
import CopyButton from "app/atoms/CopyButton";
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
  return (
    <CopyButton text={hash} type={type} {...rest}>
      <HashShortView
        hash={hash}
        firstCharsCount={firstCharsCount}
        lastCharsCount={lastCharsCount}
      />
    </CopyButton>
  );
};

export default HashChip;
