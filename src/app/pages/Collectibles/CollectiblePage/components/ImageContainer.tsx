import React, { FC } from 'react';

export const ImageContainer: FC<PropsWithChildren> = ({ children }) => (
  <div
    className="relative flex items-center justify-center rounded-8 mb-4 overflow-hidden bg-grey-4"
    style={{ aspectRatio: '1/1' }}
  >
    {children}
  </div>
);
