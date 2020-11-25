import React from "react";

type HashShortViewProps = {
  hash: string;
  trimAfter?: number;
  firstCharsCount?: number;
  lastCharsCount?: number;
};

const HashShortView = React.memo<HashShortViewProps>(
  ({ hash, trimAfter = 20, firstCharsCount = 7, lastCharsCount = 4 }) => {
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

    return <>{trimmedHash}</>;
  }
);

export default HashShortView;
