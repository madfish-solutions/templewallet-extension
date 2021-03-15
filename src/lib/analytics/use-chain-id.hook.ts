import { useContext, useEffect, useState } from "react";

import { loadChainId, useNetwork } from "../temple/front";
import { CustomRpsContext } from "./custom-rpc.context";

export const useChainId = () => {
  const internalNetwork = useNetwork();
  const customRpc = useContext(CustomRpsContext);
  const [chainId, setChainId] = useState('');

  useEffect(
    () => void (async () => setChainId(await loadChainId(customRpc ?? internalNetwork.rpcBaseURL)))(),
    [customRpc, internalNetwork.rpcBaseURL]
  );

  return chainId;
};
