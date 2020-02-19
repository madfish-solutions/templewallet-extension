import * as React from "react";
import classNames from "clsx";
import { toSvg } from "jdenticon";

type IdenticonProps = React.HTMLAttributes<HTMLDivElement> & {
  hash: number | string;
  size?: number;
};

const Identicon: React.FC<IdenticonProps> = ({
  hash,
  size = 100,
  className,
  style = {},
  ...rest
}) => {
  const backgroundImage = React.useMemo(() => {
    const svgStr = toSvg(hash, size);
    return `url('data:image/svg+xml;base64,${btoa(svgStr)}')`;
  }, [hash, size]);

  return (
    <div
      className="flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <div
        className={classNames(
          "inline-block",
          "bg-gray-100 bg-no-repeat bg-center",
          "border border-gray-200",
          "overflow-hidden",
          className
        )}
        style={{
          backgroundImage,
          width: size,
          height: size,
          borderRadius: Math.round(size / 10),
          ...style
        }}
        {...rest}
      />
    </div>
  );
};

export default Identicon;
