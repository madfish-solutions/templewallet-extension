import React from "react";

type HashShortViewProps = {
  hash: string;
  trim?: boolean;
  trimAfter?: number;
  firstCharsCount?: number;
  lastCharsCount?: number;
};

const HashShortView = React.memo<HashShortViewProps>(
  ({
    hash,
    trim = true,
    trimAfter = 20,
    firstCharsCount = 7,
    lastCharsCount = 4,
  }) => {
    if (!hash) return null;

    const trimmedHash = (() => {
      if (!trim) return hash;

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
    })();

    return <>{trimmedHash}</>;
  }
);

export default HashShortView;
