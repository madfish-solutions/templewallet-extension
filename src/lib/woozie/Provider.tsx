import React, { FC } from 'react';

import { LocationProvider } from './location';

export const Provider: FC<PropsWithChildren> = ({ children }) => <LocationProvider>{children}</LocationProvider>;
