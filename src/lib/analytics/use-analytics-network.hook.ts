import { useContext } from "react";

import { useNetwork } from "../temple/front";
import { CustomRpsContext } from "./custom-rpc.context";

export const useAnalyticsNetwork = () => {
  const internalNetwork = useNetwork();
  const customRpc = useContext(CustomRpsContext);

  return customRpc ?? internalNetwork.rpcBaseURL;
};
