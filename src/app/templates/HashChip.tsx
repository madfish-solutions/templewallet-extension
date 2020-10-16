import * as React from "react";
import CopyButton from "app/atoms/CopyButton";

type HashChipProps = React.HTMLAttributes<HTMLButtonElement> & {
  hash: string;
  firstCharsCount?: number;
  lastCharsCount?: number;
  small?: boolean;
};

const HashChip: React.FC<HashChipProps> = ({
  hash,
  firstCharsCount = 7,
  lastCharsCount = 4,
  ...rest
}) => {
  const shortHash = React.useMemo(() => {
    const ln = hash.length;
    return (
      <>
        {hash.slice(0, firstCharsCount)}
        <span className="opacity-75">...</span>
        {hash.slice(ln - lastCharsCount, ln)}
      </>
    );
  }, [hash, firstCharsCount, lastCharsCount]);

  return (
    <CopyButton text={hash} {...rest}>
      {shortHash}
    </CopyButton>
  );
};

export default HashChip;
