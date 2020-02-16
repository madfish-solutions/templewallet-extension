import * as React from "react";
import FontFaceObserver from "fontfaceobserver";

export default lazyVoid(async () => {
  const fonts = [300, 400, 600].map(
    weight => new FontFaceObserver("Inter", { weight })
  );
  await Promise.all(fonts.map(font => font.load()));
  document.body.classList.add("font-inter");
});

function lazyVoid(factory: () => Promise<void>) {
  return React.lazy(async () => {
    await factory();
    return { default: Nil };
  });
}

const Nil: React.FC = () => null;
