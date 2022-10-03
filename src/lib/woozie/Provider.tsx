import React, { FC } from 'react';

import { PropsWithChildren } from 'lib/props-with-children';

import { LocationProvider } from './location';

export const Provider: FC<PropsWithChildren> = ({ children }) => <LocationProvider>{children}</LocationProvider>;
