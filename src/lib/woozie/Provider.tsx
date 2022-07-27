import React, { FC } from 'react';

import { PropsWithChildren } from 'lib/props-with-children';
import { LocationProvider } from 'lib/woozie/location';

const Provider: FC<PropsWithChildren> = ({ children }) => <LocationProvider>{children}</LocationProvider>;

export default Provider;
