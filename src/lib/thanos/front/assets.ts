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
  useAccount
} from "lib/thanos/front";
import { isAddressValid } from "lib/thanos/helpers";
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

type BigMapStorage = {
  metadata: BigMapAbstraction;
}

function isBigMapStorage(storage: any): storage is BigMapStorage {
  return storage.metadata instanceof BigMapAbstraction;
}

function hexToUTF8(str1: string) {
  const bytes = [];
  for (let i = 0; i < str1.length; i += 2) {
    bytes.push(parseInt(str1.substr(i, 2), 16));
  }
  return utf8Decoder.decode(Uint8Array.from(bytes));
}

const OTHER_CONTRACT_KEY_REGEX = /^\/\/(KT[A-z0-9]+)\/([^/]+)/;

async function getRawTokenData(tezos: ReactiveTezosToolkit, contractAddress: string, key?: string): Promise<any> {
  const contract = await loadContract(tezos, contractAddress);
  const storage = await contract.storage<any>();
  if (isBigMapStorage(storage)) {
    const { metadata } = storage;
    if (key === undefined) {
      const rawStorageKeyHex = await metadata.get("");
      if (typeof rawStorageKeyHex !== "string") {
        return metadata;
      }
      const rawStorageKey = hexToUTF8(rawStorageKeyHex).replace("tezos-storage:", "");
      if (URL_PATTERN.test(rawStorageKey)) {
        return axios.get(rawStorageKey).then(response => response.data).catch(() => storage);
      }
      const contractKeyResult = OTHER_CONTRACT_KEY_REGEX.exec(rawStorageKey);
      if (contractKeyResult) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [_, contractAddress, storageKey] = contractKeyResult;
        if (!isAddressValid(contractAddress)) {
          throw new Error(`Invalid contract address ${contractAddress}`);
        }
        return getRawTokenData(tezos, contractAddress, storageKey);
      }
      return hexToUTF8(await metadata.get(decodeURIComponent(rawStorageKey)) as string);
    }
    return hexToUTF8(await metadata.get(decodeURIComponent(key)) as string);
  }
  return storage;
}

export async function getTokenData(tezos: ReactiveTezosToolkit, contractAddress: string) {
  const rawBigMapData = await getRawTokenData(tezos, contractAddress);
  if (typeof rawBigMapData === "string") {
    try {
      return JSON.parse(rawBigMapData);
    } catch (e) {}
  }
  return rawBigMapData;
}
