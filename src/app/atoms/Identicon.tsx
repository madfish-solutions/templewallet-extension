import * as React from "react";
import classNames from "clsx";
import { toSvg } from "jdenticon";

type IdenticonProps = React.HTMLAttributes<HTMLDivElement> & {
  hash: number | string;
  size?: number;
};

const cache = new Map<string, string>();

const Identicon: React.FC<IdenticonProps> = ({
  hash,
  size = 100,
  className,
  style = {},
  ...rest
}) => {
  const backgroundImage = React.useMemo(() => {
    const key = `${hash}_${size}`;
    if (cache.has(key)) {
      return cache.get(key);
    } else {
      const svgStr = toSvg(hash, size);
      const bi = `url('data:image/svg+xml;base64,${btoa(svgStr)}')`;
      cache.set(key, bi);
      return bi;
    }
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
