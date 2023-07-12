import React, { FC, useMemo } from 'react';

import Icon_Eyes_1f440 from './eyes-1f440.png';
import Icon_MoneyBag_1f4b0 from './money-bag-1f4b0.png';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: keyof typeof KnownEmojies;
}

export const EmojiInlineIcon: FC<Props> = ({ name, style, ...props }) => {
  const styleMemo = useMemo(() => ({ display: 'inline-block', height: '1em', ...style }), [style]);

  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} src={KnownEmojies[name]} style={styleMemo} />;
};

const KnownEmojies = {
  'eyes-1f440': Icon_Eyes_1f440,
  'money-bag-1f4b0': Icon_MoneyBag_1f4b0
};
