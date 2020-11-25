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
  trimAfter,
  firstCharsCount,
  lastCharsCount,
  type = "button",
  ...rest
}) => {
  return (
    <CopyButton text={hash} type={type} {...rest}>
      <HashShortView
        hash={hash}
        trimAfter={trimAfter}
        firstCharsCount={firstCharsCount}
        lastCharsCount={lastCharsCount}
      />
    </CopyButton>
  );
};

export default HashChip;
