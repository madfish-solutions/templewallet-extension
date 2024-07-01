import React, { memo } from 'react';

import { Avatar, AvatarProps } from './Avatar';
import { Identicon } from './Identicon';

type AccountAvatarProps = AvatarProps & {
  seed: string;
};

export const AccountAvatar = memo<AccountAvatarProps>(({ seed, size, ...restProps }) => (
  <Avatar size={size} {...restProps}>
    <Identicon type="botttsneutral" hash={seed} size={size - 4} />
  </Avatar>
));
