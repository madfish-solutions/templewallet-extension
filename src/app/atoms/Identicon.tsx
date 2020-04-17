import * as React from "react";
import classNames from "clsx";
import Avatars from "@dicebear/avatars";
import jdenticonSpirtes from "@dicebear/avatars-jdenticon-sprites";
import botttsSprites from "@dicebear/avatars-bottts-sprites";

type IdenticonProps = React.HTMLAttributes<HTMLDivElement> & {
  type?: "jdenticon" | "bottts";
  hash: string;
  size?: number;
};

const cache = new Map<string, string>();
const jdenticonIcons = new Avatars(jdenticonSpirtes);
const botttsIcons = new Avatars(botttsSprites);

const Identicon: React.FC<IdenticonProps> = ({
  type = "jdenticon",
  hash,
  size = 100,
  className,
  style = {},
  ...rest
}) => {
  const backgroundImage = React.useMemo(() => {
    const key = `${type}_${hash}_${size}`;
    if (cache.has(key)) {
      return cache.get(key);
    } else {
      const opts = {
        base64: true,
        width: size,
        height: size,
        margin: 4,
      };
      const imgSrc =
        type === "jdenticon"
          ? // ? `data:image/svg+xml;base64,${btoa(toSvg(hash, size))}`
            jdenticonIcons.create(hash, opts)
          : botttsIcons.create(hash, opts);

      const bi = `url('${imgSrc}')`;
      cache.set(key, bi);
      return bi;
    }
  }, [type, hash, size]);

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
          ...style,
        }}
        {...rest}
      />
    </div>
  );
};

export default Identicon;
