import { useContext } from "react";

import { CustomRpsContext } from "./custom-rpc.context";

export const useAnalyticsNetwork = () => useContext(CustomRpsContext);
