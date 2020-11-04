import { BigMapAbstraction } from "@taquito/taquito";
import axios from "axios";
import * as React from "react";
import {
  XTZ_ASSET,
  MAINNET_TOKENS,
  loadContract,
  useNetwork,
  useTokens,
  useStorage,
  useAllAssetsRef,
  ReactiveTezosToolkit,
  useAccount,
} from "lib/thanos/front";
import { isAddressValid, loadChainId } from "lib/thanos/helpers";
import { URL_PATTERN } from "app/defaults";

const utf8Decoder = new TextDecoder("utf-8");

export function useAssets() {
  const network = useNetwork();
  const { tokens } = useTokens();
  const allAssetsRef = useAllAssetsRef();

  const allAssets = React.useMemo(
    () => [
      XTZ_ASSET,
      ...(network.type === "main" ? MAINNET_TOKENS : []),
      ...tokens,
    ],
    [network.type, tokens]
  );

  React.useEffect(() => {
    allAssetsRef.current = allAssets;
  }, [allAssetsRef, allAssets]);

  const defaultAsset = React.useMemo(() => allAssets[0], [allAssets]);

  return { allAssets, defaultAsset };
}

export function useCurrentAsset() {
  const { allAssets, defaultAsset } = useAssets();

  const network = useNetwork();
  const account = useAccount();
  const [assetSymbol, setAssetSymbol] = useStorage(
    `assetsymbol_${network.id}_${account.publicKeyHash}`,
    defaultAsset.symbol
  );

  const currentAsset = React.useMemo(
    () => allAssets.find((a) => a.symbol === assetSymbol) ?? defaultAsset,
    [allAssets, assetSymbol, defaultAsset]
  );

  return {
    assetSymbol,
    setAssetSymbol,
    currentAsset,
  };
}

function hexToUTF8(str1: string) {
  const bytes = [];
  for (let i = 0; i < str1.length; i += 2) {
    bytes.push(parseInt(str1.substr(i, 2), 16));
  }
  return utf8Decoder.decode(Uint8Array.from(bytes));
}

const OTHER_CONTRACT_KEY_REGEX = /^\/\/(KT[A-z0-9]+)(\.[A-z0-9]+)?\/([^/]+)/;
const RPC_ID_TAG_REGEX = /^Net[A-z0-9]{12}$/;

export async function getTokenData(
  tezos: ReactiveTezosToolkit,
  contractAddress: string,
  networkId: string,
  key?: string
): Promise<any> {
  const contract = await loadContract(tezos, contractAddress);
  const storage = await contract.storage<any>();
  if (storage.metadata instanceof BigMapAbstraction) {
    const metadata = storage.metadata;
    if (key === undefined) {
      const rawStorageKeyHex = await metadata.get("");
      if (typeof rawStorageKeyHex !== "string") {
        return metadata;
      }
      const rawStorageKey = hexToUTF8(rawStorageKeyHex).replace(
        "tezos-storage:",
        ""
      );
      if (URL_PATTERN.test(rawStorageKey)) {
        return axios
          .get(rawStorageKey)
          .then((response) => response.data)
          .catch(() => storage);
      }
      const contractKeyResult = OTHER_CONTRACT_KEY_REGEX.exec(rawStorageKey);
      if (contractKeyResult) {
        const [
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          _,
          contractAddress,
          rawNetworkTag,
          storageKey,
        ] = contractKeyResult;
        if (!isAddressValid(contractAddress)) {
          throw new Error(`Invalid contract address ${contractAddress}`);
        }
        const networkTag = rawNetworkTag?.substr(1);
        const networkTagIsChainId =
          !!networkTag && RPC_ID_TAG_REGEX.test(networkTag);
        const rpcChainId = await loadChainId(tezos.rpc.getRpcUrl());
        if (
          networkTag &&
          ((networkTagIsChainId && rpcChainId !== networkTag) ||
            (!networkTagIsChainId && networkId !== networkTag))
        ) {
          throw new Error(
            `${networkTag} network was specified, which is not current network`
          );
        }
        return getTokenData(tezos, contractAddress, networkId, storageKey);
      }
      return JSON.parse(
        hexToUTF8(
          (await metadata.get(decodeURIComponent(rawStorageKey))) as string
        )
      );
    }
    return hexToUTF8((await metadata.get(decodeURIComponent(key))) as string);
  }
  if (storage.token_metadata instanceof BigMapAbstraction) {
    const metadata: BigMapAbstraction = storage.token_metadata;
    return metadata.get("0");
  }
  if (key) {
    return storage[key];
  }
  return storage;
}
