import { TZStatsNetwork } from "lib/tzstats";
import { ThanosNetwork, ThanosNetworkType } from "lib/thanos/types";

export const NETWORKS: ThanosNetwork[] = [
  {
    id: "mainnet",
    name: "Tezos Mainnet",
    type: ThanosNetworkType.Main,
    rpcBaseURL: "https://mainnet.tezos.org.ua",
    tzStats: TZStatsNetwork.Mainnet,
    color: "#83b300",
    disabled: false
  },
  {
    id: "babylonnet",
    name: "Babylonnet",
    type: ThanosNetworkType.Test,
    rpcBaseURL: "https://babylonnet.tezos.org.ua",
    tzStats: TZStatsNetwork.Babylonnet,
    color: "#ed6663",
    disabled: false
  },
  {
    id: "carthagenet",
    name: "Carthagenet",
    type: ThanosNetworkType.Test,
    rpcBaseURL: "https://carthagenet.tezos.org.ua",
    tzStats: TZStatsNetwork.Carthagenet,
    color: "#0f4c81",
    disabled: false
  },
  {
    id: "labnet",
    name: "Labnet",
    type: ThanosNetworkType.Test,
    rpcBaseURL: "https://labnet.tezos.org.ua",
    tzStats: TZStatsNetwork.Labnet,
    color: "#f6c90e",
    disabled: false
  },
  {
    id: "zeronet",
    name: "Zeronet",
    type: ThanosNetworkType.Test,
    rpcBaseURL: "<no public nodes>",
    tzStats: TZStatsNetwork.Zeronet,
    color: "#e9e1cc",
    disabled: true
  }
];
