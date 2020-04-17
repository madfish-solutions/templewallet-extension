import * as React from "react";
import { LocationProvider } from "lib/woozie/location";

const Provider: React.FC = ({ children }) => (
  <LocationProvider>{children}</LocationProvider>
);

export default Provider;
