import * as React from "react";
import classNames from "clsx";
import Avatars from "@dicebear/avatars";
import jdenticonSpirtes from "@dicebear/avatars-jdenticon-sprites";
import botttsSprites from "@dicebear/avatars-bottts-sprites";
import initialsSprites from "lib/avatars-initials-sprites";

type IdenticonProps = React.HTMLAttributes<HTMLDivElement> & {
  type?: "jdenticon" | "bottts" | "initials";
  hash: string;
  size?: number;
};

const MAX_INITIALS_LENGTH = 5;
const DEFAULT_FONT_SIZE = 50;

const cache = new Map<string, string>();

const icons: Record<NonNullable<IdenticonProps["type"]>, Avatars<{}>> = {
  jdenticon: new Avatars(jdenticonSpirtes),
  bottts: new Avatars(botttsSprites),
  initials: new Avatars(initialsSprites),
};

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
      const basicOpts = {
        base64: true,
        width: size,
        height: size,
        margin: 4,
      };

      const opts =
        type === "initials"
          ? {
              ...basicOpts,
              chars: MAX_INITIALS_LENGTH,
              radius: 50,
              fontSize: estimateOptimalFontSize(
                hash.slice(0, MAX_INITIALS_LENGTH).length
              ),
            }
          : basicOpts;
      const imgSrc = icons[type].create(hash, opts);

      const bi = `url('${imgSrc}')`;
      cache.set(key, bi);
      return bi;
    }
  }, [type, hash, size]);

  return (
    <div
      className={classNames(
        "inline-block",
        type === "initials" ? "bg-transparent" : "bg-gray-100",
        "bg-no-repeat bg-center",
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
  );
};

export default Identicon;

function estimateOptimalFontSize(length: number) {
  const initialsLength = Math.min(length, MAX_INITIALS_LENGTH);
  if (initialsLength > 2) {
    const n = initialsLength;
    const multiplier = Math.sqrt(
      10000 / ((32 * n + 4 * (n - 1)) ** 2 + 36 ** 2)
    );
    return Math.floor(DEFAULT_FONT_SIZE * multiplier);
  }
  return DEFAULT_FONT_SIZE;
}
