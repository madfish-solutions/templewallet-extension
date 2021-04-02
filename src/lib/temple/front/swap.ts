import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";

import {
  batchify,
  loadContract,
  withTokenApprove,
} from "lib/temple/front";
import { TempleAsset, TempleAssetType, TempleChainId } from "lib/temple/types";

export type ExchangerType = "dexter" | "quipuswap";

type SwapContractDescriptor = {
  type: ExchangerType;
  address: string;
};

export type AssetIdentifier = { address?: string; tokenId?: number };

export type SwapParams = {
  accountPkh: string;
  inputAsset: TempleAsset;
  inputContractAddress?: string;
  outputAsset: TempleAsset;
  outputContractAddress?: string;
  exchangerType: ExchangerType;
  inputAmount: BigNumber;
  tolerance: number;
  tezos: TezosToolkit;
};

export type TempleAssetWithExchangeData = TempleAsset & Partial<Record<
  ExchangerType,
  { usdPrice?: number, maxExchangable?: BigNumber }
>>;

export const ALL_EXCHANGERS_TYPES: ExchangerType[] = ["dexter", "quipuswap"];

// chainId -> token -> contract
export const DEXTER_EXCHANGE_CONTRACTS = new Map<
  string,
  Record<string, Record<number, string>>
>([
  [
    TempleChainId.Mainnet,
    {
      KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn: {
        0: "KT1BGQR7t4izzKZ7eRodKWTodAsM23P38v7N",
      },
      KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV: {
        0: "KT1AbYeDbjjcAnV1QK7EZUUdqku77CdkTuv6",
      },
      KT1VYsVfmobT7rsMVivvZ4J8i3bPiqz12NaH: {
        0: "KT1D56HQfMmwdopmFLTwNHFJSs6Dsg2didFo",
      },
      KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8: {
        0: "KT1PDrBE59Zmxnb8vXRgRAG1XmvTMTs5EDHU",
      },
      KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9: {
        0: "KT1Tr2eG3eVmPRbymrbU2UppUmKjFPXomGG9",
      },
    },
  ],
  [
    TempleChainId.Edo2net,
    {
      KT1CUg39jQF8mV6nTMqZxjUUZFuz1KXowv3K: {
        0: "KT1BYYLfMjufYwqFtTSYJND7bzKNyK7mjrjM",
      },
      KT1FCMQk44tEP9fm9n5JJEhkSk1TW3XQdaWH: {
        0: "KT1RfTPvrfAQDGAJ7wB71EtwxLQgjmfz59kE",
      },
    },
  ],
]);

export const QUIPUSWAP_CONTRACTS = new Map<
  string,
  Partial<Record<"fa12Factory" | "fa2Factory", string>>
>([
  [
    TempleChainId.Edo2net,
    {
      fa12Factory: "KT1HPKpoCJm9Gg4cRxqZX8Hg6Uth1NzrFAeQ",
      fa2Factory: "KT18uK1EmY3QBc4KTNG6pmtU736tTYLE5AYE",
    },
  ],
  [
    TempleChainId.Florencenet,
    {
      fa12Factory: "KT1WkKiDSsDttdWrfZgcQ6Z9e3Cp4unHP2CP",
      fa2Factory: "KT1Bps1VtszT2T3Yvxm5PJ6Rx2nk1FykWPdU"
    }
  ],
  [
    TempleChainId.Mainnet,
    {
      fa12Factory: "KT1K7whn5yHucGXMN7ymfKiX5r534QeaJM29",
      fa2Factory: "KT1MMLb2FVrrE9Do74J3FH1RNNc4QhDuVCNX"
    }
  ]
]);

export function matchesAsset(assetId: AssetIdentifier, asset: TempleAsset) {
  if (asset.type === TempleAssetType.TEZ) {
    return !assetId.address;
  }
  if (assetId.address !== asset.address) {
    return false;
  }
  return asset.type !== TempleAssetType.FA2 || assetId.tokenId === asset.id;
}

export function getAssetId(asset: TempleAsset): AssetIdentifier {
  switch (asset.type) {
    case TempleAssetType.TEZ:
      return {};
    case TempleAssetType.FA2:
      return { address: asset.address, tokenId: asset.id };
    default:
      return { address: asset.address };
  }
}

export function idsAreEqual(id1: AssetIdentifier, id2: AssetIdentifier) {
  return id1.address === id2.address && id1.tokenId === id2.tokenId;
}

function floor(x: BigNumber) {
  return x.integerValue(BigNumber.ROUND_FLOOR);
}

export async function getPoolParameters(
  tezos: TezosToolkit,
  contractAddress: string,
  type: ExchangerType
): Promise<{ tokenPool: BigNumber; xtzPool: BigNumber }> {
  const contract = await loadContract(tezos, contractAddress, false);
  const storage = await contract.storage<any>();
  if (type === "dexter") {
    return {
      tokenPool: storage.tokenPool,
      xtzPool: storage.xtzPool,
    };
  }

  return {
    tokenPool: storage.storage.token_pool,
    xtzPool: storage.storage.tez_pool,
  };
}

const QUIPUSWAP_FEE_RATE = 333;

export async function getMutezOutput(
  tezos: TezosToolkit,
  tokenAmount: BigNumber,
  { address, type }: SwapContractDescriptor
) {
  const { tokenPool, xtzPool } = await getPoolParameters(tezos, address, type);
  const invariant = tokenPool.multipliedBy(xtzPool);
  if (invariant.eq(0)) {
    return new BigNumber(0);
  }
  if (type === "dexter") {
    return tokenAmount
      .multipliedBy(997)
      .multipliedBy(xtzPool)
      .idiv(tokenPool.multipliedBy(1000).plus(tokenAmount.multipliedBy(997)));
  }
  const fee = tokenAmount.idiv(QUIPUSWAP_FEE_RATE);
  const tempTokenPool = tokenPool.plus(tokenAmount).minus(fee);
  const remainder = invariant.idiv(tempTokenPool);
  return xtzPool.minus(remainder);
}

export async function getTokenOutput(
  tezos: TezosToolkit,
  mutezAmount: BigNumber,
  { address, type }: SwapContractDescriptor
) {
  const { tokenPool, xtzPool } = await getPoolParameters(tezos, address, type);
  const invariant = tokenPool.multipliedBy(xtzPool);
  if (invariant.eq(0)) {
    return new BigNumber(0);
  }
  if (type === "dexter") {
    return mutezAmount
      .multipliedBy(997)
      .multipliedBy(tokenPool)
      .idiv(xtzPool.multipliedBy(1000).plus(mutezAmount.multipliedBy(997)));
  }
  const newXtzPool = xtzPool.plus(mutezAmount);
  const fee = mutezAmount.idiv(QUIPUSWAP_FEE_RATE);
  const newTokenPool = invariant.idiv(newXtzPool.minus(fee));
  return tokenPool.minus(newTokenPool);
}

export async function swap({
  accountPkh,
  inputAsset,
  inputContractAddress,
  outputAsset,
  outputContractAddress,
  exchangerType,
  inputAmount,
  tolerance,
  tezos,
}: SwapParams) {
  const transactionsBatch = tezos.wallet.batch([]);
  const rawInputAssetAmount = inputAmount.multipliedBy(
    new BigNumber(10).pow(inputAsset.decimals)
  );
  const inputIsTz = inputAsset.type === TempleAssetType.TEZ;
  const outputIsTz = outputAsset.type === TempleAssetType.TEZ;
  let mutezOutput = inputIsTz
    ? rawInputAssetAmount
    : await getMutezOutput(tezos, rawInputAssetAmount, {
        address: inputContractAddress!,
        type: exchangerType,
      });
  const deadline = Math.floor(Date.now() / 1000) + 30 * 60 * 1000;
  const toleranceQuotient = new BigNumber(1).minus(tolerance);
  const tokenToTokenMiddleQuotient = toleranceQuotient.sqrt();
  if (inputAsset.type !== TempleAssetType.TEZ) {
    const exchangeContract = await loadContract(tezos, inputContractAddress!);
    mutezOutput = BigNumber.max(
      floor(
        mutezOutput.multipliedBy(
          outputIsTz ? toleranceQuotient : tokenToTokenMiddleQuotient
        )
      ),
      1
    );
    const exchangeOperations = [
      exchangerType === "quipuswap"
        ? exchangeContract.methods
            .tokenToTezPayment(
              rawInputAssetAmount.toNumber(),
              mutezOutput.toNumber(),
              accountPkh
            )
            .toTransferParams()
        : exchangeContract.methods
            .tokenToXtz(
              accountPkh,
              accountPkh,
              rawInputAssetAmount.toNumber(),
              mutezOutput.toNumber(),
              deadline.toString()
            )
            .toTransferParams(),
    ];
    batchify(
      transactionsBatch,
      await withTokenApprove(tezos, exchangeOperations, {
        tokenAddress: inputAsset.address,
        tokenId:
          inputAsset.type === TempleAssetType.FA2 ? inputAsset.id : undefined,
        from: accountPkh,
        to: inputContractAddress!,
        value: rawInputAssetAmount,
      })
    );
  }
  if (outputAsset.type !== TempleAssetType.TEZ) {
    const exchangeContract = await loadContract(tezos, outputContractAddress!);
    const maxTokensOutput = await getTokenOutput(tezos, mutezOutput, {
      address: outputContractAddress!,
      type: exchangerType,
    });
    const tokensOutput = BigNumber.max(
      floor(maxTokensOutput.multipliedBy(toleranceQuotient)),
      1
    );
    batchify(transactionsBatch, [
      exchangerType === "quipuswap"
        ? exchangeContract.methods
            .tezToTokenPayment(tokensOutput.toNumber(), accountPkh)
            .toTransferParams({ amount: mutezOutput.toNumber(), mutez: true })
        : exchangeContract.methods
            .xtzToToken(
              accountPkh,
              tokensOutput.toNumber(),
              deadline.toString()
            )
            .toTransferParams({ amount: mutezOutput.toNumber(), mutez: true }),
    ]);
  }
  return transactionsBatch.send();
}
