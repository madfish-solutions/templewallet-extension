import React from "react";

type HashShortViewProps = {
  hash: string;
  firstCharsCount?: number;
  lastCharsCount?: number;
};

const HashShortView = React.memo<HashShortViewProps>(
  ({ hash, firstCharsCount = 7, lastCharsCount = 4 }) => {
    return (
      <>
        {hash.slice(0, firstCharsCount)}
        <span className="opacity-75">...</span>
        {hash.slice(-lastCharsCount)}
      </>
    );
  }
);

export default HashShortView;
