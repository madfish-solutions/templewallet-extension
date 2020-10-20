import { ThanosNetwork } from "lib/thanos/types";
import { getMessage } from "lib/i18n";

export const NETWORKS: ThanosNetwork[] = [
  {
    id: "mainnet",
    name: getMessage("tezosMainnet"),
    nameI18nKey: "tezosMainnet",
    description: getMessage("tezosMainnetDescription"),
    descriptionI18nKey: "tezosMainnetDescription",
    type: "main",
    rpcBaseURL: "https://mainnet-tezos.giganode.io",
    color: "#83b300",
    disabled: false,
  },
  {
    id: "carthagenet",
    name: getMessage("carthageTestnet"),
    nameI18nKey: "carthageTestnet",
    description: getMessage("carthageTestnetDescription"),
    descriptionI18nKey: "carthageTestnetDescription",
    type: "test",
    rpcBaseURL: "https://testnet-tezos.giganode.io",
    color: "#0f4c81",
    disabled: false,
  },
  {
    id: "delphinet",
    name: "Delphi Testnet (soon)",
    description: "Delphi testnet",
    type: "test",
    rpcBaseURL: "https://delphinet-tezos.giganode.io",
    color: "#ed6663",
    disabled: true,
  },
  {
    id: "sandbox",
    name: "localhost:8732",
    description: getMessage("localSandbox"),
    descriptionI18nKey: "localSandbox",
    type: "test",
    rpcBaseURL: "http://localhost:8732",
    color: "#e9e1cc",
    disabled: false,
  },
];
