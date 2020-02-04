import * as React from "react";
import { useLocationContext } from "lib/woozie/location";

const Provider: React.FC = ({ children }) => (
  <useLocationContext.Provider>{children}</useLocationContext.Provider>
);

export default Provider;
