import React, { FC, useMemo } from 'react';

import Icon_HeartEyes_1f60d from './heart-eyes-1f60d.png';
import Icon_Smirk_1f60f from './smirk-1f60f.png';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: keyof typeof KnownEmojies;
}

export const EmojiInlineIcon: FC<Props> = ({ name, style, ...props }) => {
  const styleMemo = useMemo(() => ({ display: 'inline', verticalAlign: 'text-top', height: '1em', ...style }), [style]);

  // eslint-disable-next-line jsx-a11y/alt-text
  return <img alt={name} {...props} src={KnownEmojies[name]} style={styleMemo} />;
};

const KnownEmojies = {
  'heart-eyes-1f60d': Icon_HeartEyes_1f60d,
  'smirk-1f60f': Icon_Smirk_1f60f
};
