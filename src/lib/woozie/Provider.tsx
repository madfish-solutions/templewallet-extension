import React, { FC } from "react";

import { LocationProvider } from "lib/woozie/location";

const Provider: FC = ({ children }) => (
  <LocationProvider>{children}</LocationProvider>
);

export default Provider;
