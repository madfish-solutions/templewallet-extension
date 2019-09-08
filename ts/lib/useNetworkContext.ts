import * as React from "react";
import createUseContext from "constate";

const NETWORKS = [
  {
    id: "alphanet",
    label: "Alpha Test Network",
    color: "#29b6af",
    config: {
      url: "https://conseil-dev.cryptonomic-infra.tech",
      apiKey: "bakingbad"
    },
    server: "https://alphanet-node.tzscan.io"
  },
  {
    id: "mainnet",
    label: "Main Tezos Network",
    color: "#ff4a8d",
    config: {
      url: "https://conseil-dev.cryptonomic-infra.tech",
      apiKey: "bakingbad"
    },
    server: "https://alphanet-node.tzscan.io"
  }
];

export default createUseContext(useNetwork);

function useNetwork() {
  const [network, setNetwork] = React.useState(() => NETWORKS[0]);
  return {
    network,
    setNetwork,
    networks: NETWORKS
  };
}
