import React, { FC } from 'react';

import FontFaceObserver from 'fontfaceobserver';

import { useTypedSWR } from 'lib/swr';

interface AwaitFontsProps extends PropsWithChildren {
  name: string;
  weights: number[];
  className: string;
}

const AwaitFonts: FC<AwaitFontsProps> = ({ name, weights, className, children }) => {
  useTypedSWR([name, weights, className], awaitFonts, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false
  });

  return <>{children}</>;
};

export default AwaitFonts;

async function awaitFonts([name, weights, className]: [string, number[], string]) {
  try {
    const fonts = weights.map(weight => new FontFaceObserver(name, { weight }));
    await Promise.all(fonts.map(font => font.load()));
    document.body.classList.add(...className.split(' '));
  } catch (err: any) {
    console.error(err);
  }
  return null;
}
