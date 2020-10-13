import { ThanosNetwork } from "lib/thanos/types";
import { t } from "lib/ui/i18n";

export const NETWORKS: ThanosNetwork[] = [
  {
    id: "mainnet",
    name: t("tezosMainnet"),
    description: t("tezosMainnetDescription"),
    type: "main",
    rpcBaseURL: "https://mainnet-tezos.giganode.io",
    color: "#83b300",
    disabled: false,
  },
  {
    id: "carthagenet",
    name: t("carthageTestnet"),
    description: t("carthageTestnetDescription"),
    type: "test",
    rpcBaseURL: "https://testnet-tezos.giganode.io",
    color: "#0f4c81",
    disabled: false,
  },
  {
    id: "dalphanet",
    name: t("dAlphaTestnet"),
    description: t("dAlphaTestnetDescription"),
    type: "test",
    rpcBaseURL: "https://dalphanet-tezos.giganode.io",
    color: "#ed6663",
    disabled: true,
  },
  {
    id: "sandbox",
    name: "localhost:8732",
    description: t("localSandbox"),
    type: "test",
    rpcBaseURL: "http://localhost:8732",
    color: "#e9e1cc",
    disabled: false,
  },
];
