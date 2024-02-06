import React, { FC, useMemo } from 'react';

import Icon_PartyPopper_1f389 from './party-popper-1f389.png';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  name: keyof typeof KnownEmojies;
}

export const EmojiInlineIcon: FC<Props> = ({ name, style, ...props }) => {
  const styleMemo = useMemo(() => ({ display: 'inline-block', height: '1em', ...style }), [style]);

  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} src={KnownEmojies[name]} style={styleMemo} />;
};

const KnownEmojies = {
  'party-popper-1f389': Icon_PartyPopper_1f389
};
