import * as React from "react";
import CopyButton from "app/atoms/CopyButton";

type HashChipProps = React.HTMLAttributes<HTMLButtonElement> & {
  hash: string;
  trimAfter?: number;
  firstCharsCount?: number;
  lastCharsCount?: number;
  small?: boolean;
};

const HashChip: React.FC<HashChipProps> = ({
  hash,
  trimAfter = 20,
  firstCharsCount = 7,
  lastCharsCount = 4,
  ...rest
}) => {
  const trimmedHash = React.useMemo(() => {
    const ln = hash.length;
    return ln > trimAfter ? (
      <>
        {hash.slice(0, firstCharsCount)}
        <span className="opacity-75">...</span>
        {hash.slice(ln - lastCharsCount, ln)}
      </>
    ) : (
      hash
    );
  }, [hash, trimAfter, firstCharsCount, lastCharsCount]);

  return (
    <CopyButton text={hash} {...rest}>
      {trimmedHash}
    </CopyButton>
  );
};

export default HashChip;
