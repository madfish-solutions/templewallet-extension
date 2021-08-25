import { TezosToolkit } from "@taquito/taquito";
import BigNumber from "bignumber.js";

import assert from "lib/assert";
import {
  batchify,
  loadContract,
  withTokenApprove,
  TempleChainId,
  isTezAsset,
  AssetMetadata,
  fromAssetSlug,
  toTokenSlug,
} from "lib/temple/front";

export type ExchangerType = "dexter" | "quipuswap";

type SwapContractDescriptor = {
  type: ExchangerType;
  address: string;
};

export type AssetIdentifier = { address?: string; tokenId?: number };

export type SwapParams = {
  accountPkh: string;
  inputAssetSlug: string;
  inputAssetMetadata: AssetMetadata;
  inputContractAddress?: string;
  outputAssetSlug: string;
  outputContractAddress?: string;
  exchangerType: ExchangerType;
  inputAmount: BigNumber;
  tolerance: number;
  tezos: TezosToolkit;
};

export const ALL_EXCHANGERS_TYPES: ExchangerType[] = ["dexter", "quipuswap"];

export const EXCHANGE_XTZ_RESERVE = new BigNumber("0.3");

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
  Partial<Record<"fa12Factory" | "fa2Factory", string[]>>
>([
  [
    TempleChainId.Edo2net,
    {
      fa12Factory: ["KT1WEcbPNGZNe6d5pm3eNufqe7cHS77DBG2G"],
      fa2Factory: ["KT1KGdYTfLdzTKpyQbKkHJ2ASmBYa84hnCiQ"],
    },
  ],
  [
    TempleChainId.Florencenet,
    {
      fa12Factory: [
        "KT195gyo5G7pay2tYweWDeYFkGLqcvQTXoCW",
        "KT1We4CHneKjnCkovTDV34qc4W7xzWbn5LwY",
      ],
      fa2Factory: [
        "KT1HjLwPC3sbh6W5HjaKBsiVPTgptcNbnXnc",
        "KT1SQX24W2v6D5sgihznax1eBykEGQNc7UpD",
      ],
    },
  ],
  [
    TempleChainId.Mainnet,
    {
      fa12Factory: [
        "KT1FWHLMk5tHbwuSsp31S4Jum4dTVmkXpfJw",
        "KT1Lw8hCoaBrHeTeMXbqHPG4sS4K1xn7yKcD",
      ],
      fa2Factory: [
        "KT1PvEyN1xCFCgorN92QCfYjw3axS6jawCiJ",
        "KT1SwH9P1Tx8a58Mm6qBExQFTcy2rwZyZiXS",
      ],
    },
  ],
]);

export function matchesAsset(assetId: AssetIdentifier, assetSlug: string) {
  return assetId.address
    ? assetSlug === toTokenSlug(assetId.address, assetId.tokenId)
    : isTezAsset(assetSlug);
}

// export function getAssetId(assetSlug: string): AssetIdentifier {
//   switch (asset.type) {
//     case TempleAssetType.TEZ:
//       return {};
//     case TempleAssetType.FA2:
//       return { address: asset.address, tokenId: asset.id };
//     default:
//       return { address: asset.address };
//   }
// }

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
  const tokenInWithFee = tokenAmount.multipliedBy(997);
  return tokenInWithFee
    .times(xtzPool)
    .idiv(tokenPool.times(1000).plus(tokenInWithFee));
}

export async function getMutezInput(
  tezos: TezosToolkit,
  tokenAmount: BigNumber,
  { address, type }: SwapContractDescriptor
) {
  if (tokenAmount.eq(0)) {
    return new BigNumber(0);
  }
  const { tokenPool, xtzPool } = await getPoolParameters(tezos, address, type);
  const numerator = xtzPool.times(1000).times(tokenAmount);
  const denominator = tokenPool.minus(tokenAmount).times(997);
  return numerator.idiv(denominator).plus(1);
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
  const tezInWithFee = mutezAmount.multipliedBy(997);
  return tezInWithFee
    .times(tokenPool)
    .idiv(xtzPool.times(1000).plus(tezInWithFee));
}

export async function getTokenInput(
  tezos: TezosToolkit,
  mutezAmount: BigNumber,
  { address, type }: SwapContractDescriptor
) {
  if (mutezAmount.eq(0)) {
    return new BigNumber(0);
  }
  const { tokenPool, xtzPool } = await getPoolParameters(tezos, address, type);
  const numerator = tokenPool.times(1000).times(mutezAmount);
  const denominator = xtzPool.minus(mutezAmount).times(997);
  return numerator.idiv(denominator).plus(1);
}

export async function swap({
  accountPkh,
  inputAssetSlug,
  inputAssetMetadata,
  inputContractAddress,
  outputAssetSlug,
  outputContractAddress,
  exchangerType,
  inputAmount,
  tolerance,
  tezos,
}: SwapParams) {
  const transactionsBatch = tezos.wallet.batch([]);
  const rawInputAssetAmount = inputAmount.multipliedBy(
    new BigNumber(10).pow(inputAssetMetadata.decimals)
  );
  const inputIsTz = isTezAsset(inputAssetSlug);
  const outputIsTz = isTezAsset(outputAssetSlug);
  let mutezOutput = inputIsTz
    ? rawInputAssetAmount
    : await getMutezOutput(tezos, rawInputAssetAmount, {
        address: inputContractAddress!,
        type: exchangerType,
      });
  const deadline = Math.floor(Date.now() / 1000) + 30 * 60 * 1000;
  const toleranceQuotient = new BigNumber(1).minus(tolerance);
  const tokenToTokenMiddleQuotient = toleranceQuotient.sqrt();
  if (!inputIsTz) {
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
            .tokenToTezPayment(rawInputAssetAmount, mutezOutput, accountPkh)
            .toTransferParams()
        : exchangeContract.methods
            .tokenToXtz(
              accountPkh,
              accountPkh,
              rawInputAssetAmount,
              mutezOutput,
              deadline.toString()
            )
            .toTransferParams(),
    ];
    const inputAsset = await fromAssetSlug(tezos, inputAssetSlug);
    assert(!isTezAsset(inputAsset));
    batchify(
      transactionsBatch,
      await withTokenApprove(tezos, exchangeOperations, {
        tokenAddress: inputAsset.contract,
        tokenId: inputAsset.id,
        from: accountPkh,
        to: inputContractAddress!,
        value: rawInputAssetAmount,
      })
    );
  }
  if (!outputIsTz) {
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
            .tezToTokenPayment(tokensOutput, accountPkh)
            .toTransferParams({ amount: mutezOutput.toNumber(), mutez: true })
        : exchangeContract.methods
            .xtzToToken(accountPkh, tokensOutput, deadline.toString())
            .toTransferParams({ amount: mutezOutput.toNumber(), mutez: true }),
    ]);
  }
  return transactionsBatch.send();
}
