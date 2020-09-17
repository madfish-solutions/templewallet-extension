import * as React from "react";
import useSWR from "swr";
import FontFaceObserver from "fontfaceobserver";

type AwaitFontsProps = {
  name: string;
  weights: number[];
  className: string;
};

const AwaitFonts: React.FC<AwaitFontsProps> = ({
  name,
  weights,
  className,
  children,
}) => {
  useSWR([name, weights, className], awaitFonts, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return <>{children}</>;
};

export default AwaitFonts;

async function awaitFonts(name: string, weights: number[], className: string) {
  try {
    const fonts = weights.map(
      (weight) => new FontFaceObserver(name, { weight })
    );
    await Promise.all(fonts.map((font) => font.load()));
    document.body.classList.add(...className.split(" "));
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error(err);
    }
  } finally {
    return null;
  }
}
