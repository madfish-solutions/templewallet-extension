import classNames from "clsx";
import React, { useCallback, useState } from "react";

export type FlagProps = {
  alt: string;
  className?: string;
  src?: string;
};

const Flag: React.FC<FlagProps> = (props) => {
  const { alt, className, src } = props;
  const [error, setError] = useState(false);

  const handleError = useCallback(() => {
    setError(true);
  }, [setError]);

  if (!src) {
    return <FlagStub className="w-6 h-auto" />;
  }

  return (
    <div
      className={classNames("w-6 flex justify-center items-center", className)}
      style={{ height: "1.3125rem" }}
    >
      {src ? (
        <>
          <img
            alt={alt}
            className={classNames({ hidden: error })}
            src={src}
            onError={handleError}
          />
          {error && <FlagStub className="w-6 h-auto" />}
        </>
      ) : (
        <FlagStub className="w-6 h-auto" />
      )}
    </div>
  );
};

export default Flag;

const FlagStub = React.memo((props: React.HTMLAttributes<unknown>) => (
  <svg
    role="img"
    xmlns="http://www.w3.org/2000/svg"
    width="48px"
    height="48px"
    viewBox="2 2 20 20"
    stroke="#e53e3e"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
    {...props}
  >
    <path d="M6.34314575 6.34314575L17.6568542 17.6568542M6.34314575 17.6568542L17.6568542 6.34314575" />
  </svg>
));
