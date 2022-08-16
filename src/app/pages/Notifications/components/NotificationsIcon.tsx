import React, { FC } from 'react';

import { PropsWithChildren } from 'lib/props-with-children';

export interface NotificationsIconProps extends PropsWithChildren {
  isDotVisible?: boolean;
  small?: boolean;
}

export const NotificationsIcon: FC<NotificationsIconProps> = ({ isDotVisible, small, children }) => (
  <div className="relative">
    {isDotVisible && (
      <span
        className="absolute bg-red-600"
        style={{
          top: 1,
          right: small ? 2 : 0,
          width: small ? 4 : 6,
          height: small ? 4 : 6,
          outlineWidth: small ? 0.5 : 1,
          outlineColor: 'white',
          outlineStyle: 'solid',
          borderRadius: '50%'
        }}
      />
    )}
    {children}
  </div>
);
