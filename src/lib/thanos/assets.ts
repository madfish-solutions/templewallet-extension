import { browser } from "webextension-polyfill-ts";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import BigNumber from "bignumber.js";
import { ThanosAsset, ThanosToken, ThanosAssetType } from "lib/thanos/types";
import {
  loadContract,
  loadContractForCallLambdaView,
} from "lib/thanos/contract";
import { mutezToTz } from "lib/thanos/helpers";
import assert, { AssertionError } from "lib/assert";
import { getMessage } from "lib/i18n";

export const XTZ_ASSET: ThanosAsset = {
  type: ThanosAssetType.XTZ,
  name: "Tezos",
  symbol: "XTZ",
  decimals: 6,
  fungible: true,
  default: true,
};

export const DELPHINET_TOKENS: ThanosToken[] = [
  {
    type: ThanosAssetType.FA1_2,
    address: "KT1RXpLtz22YgX24QQhxKVyKvtKZFaAVtTB9",
    name: "Kolibri",
    symbol: "kUSD",
    decimals: 18,
    fungible: true,
    iconUrl: "https://kolibri-data.s3.amazonaws.com/logo.png",
    default: true,
  },
  {
    type: ThanosAssetType.FA1_2,
    address: "KT1TDHL9ipKL8WW3TMPvutbLh9uZBdY9BU59",
    name: "Wrapped Tezos",
    symbol: "wXTZ",
    decimals: 6,
    fungible: true,
    iconUrl:
      "https://github.com/StakerDAO/wrapped-xtz/blob/dev/assets/wXTZ-token-FullColor.png?raw=true",
    default: true,
  },
];

export const MAINNET_TOKENS: ThanosToken[] = [
  {
    type: ThanosAssetType.TzBTC,
    address: "KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn",
    name: "Tezos BTC",
    symbol: "tzBTC",
    decimals: 8,
    fungible: true,
    iconUrl:
      "https://tzbtc.io/wp-content/uploads/2020/03/tzbtc_logo_single.svg",
    default: true,
  },
  {
    type: ThanosAssetType.FA1_2,
    address: "KT1VYsVfmobT7rsMVivvZ4J8i3bPiqz12NaH",
    name: "Wrapped Tezos",
    symbol: "wXTZ",
    decimals: 6,
    fungible: true,
    iconUrl:
      "https://github.com/StakerDAO/wrapped-xtz/blob/dev/assets/wXTZ-token-FullColor.png?raw=true",
    default: true,
  },
  {
    type: ThanosAssetType.FA1_2,
    address: "KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9",
    name: "USD Tez",
    symbol: "USDtz",
    decimals: 6,
    fungible: true,
    iconUrl: "https://usdtz.com/lightlogo10USDtz.png",
    default: true,
  },
  {
    type: ThanosAssetType.FA1_2,
    address: "KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8",
    name: "ETH Tez",
    symbol: "ETHtz",
    decimals: 18,
    fungible: true,
    iconUrl: browser.runtime.getURL("misc/token-logos/ethtz.png"),
    default: true,
  },
  {
    type: ThanosAssetType.Staker,
    address: "KT1EctCuorV2NfVb1XTQgvzJ88MQtWP8cMMv",
    name: "Staker",
    symbol: "STKR",
    decimals: 0,
    fungible: true,
    iconUrl:
      "https://miro.medium.com/fit/c/160/160/1*LzmHCYryGmuN9ZR7JX951w.png",
    default: true,
  },
  {
    type: ThanosAssetType.FA1_2,
    address: "KT1K9gCRgaLRFKTErYt1wVxA3Frb9FjasjTV",
    name: "Kolibri",
    symbol: "kUSD",
    decimals: 18,
    fungible: true,
    iconUrl: "https://kolibri-data.s3.amazonaws.com/logo.png",
    default: true,
  },
];

function signatureAssertionFactory(name: string, args: string[]) {
  return (contract: WalletContract) => {
    const signatures = contract.parameterSchema.ExtractSignatures();
    const receivedSignature = signatures.find(
      (signature) => signature[0] === name
    );
    assert(receivedSignature);
    const receivedArgs = receivedSignature.slice(1);
    assert(receivedArgs.length === args.length);
    receivedArgs.forEach((receivedArg, index) =>
      assert(receivedArg === args[index])
    );
  };
}

function viewSuccessAssertionFactory(name: string, args: any[]) {
  return async (contract: WalletContract, tezos: TezosToolkit) => {
    assert(contract.views[name]);
    await contract.views[name](...args).read((tezos as any).lambdaContract);
  };
}

const STUB_TEZOS_ADDRESS = "tz1TTXUmQaxe1dTLPtyD4WMQP6aKYK9C8fKw";
const FA12_METHODS_ASSERTIONS = [
  {
    name: "transfer",
    assertion: signatureAssertionFactory("transfer", [
      "address",
      "address",
      "nat",
    ]),
  },
  {
    name: "approve",
    assertion: signatureAssertionFactory("approve", ["address", "nat"]),
  },
  {
    name: "getAllowance",
    assertion: viewSuccessAssertionFactory("getAllowance", [
      STUB_TEZOS_ADDRESS,
      STUB_TEZOS_ADDRESS,
    ]),
  },
  {
    name: "getBalance",
    assertion: viewSuccessAssertionFactory("getBalance", [STUB_TEZOS_ADDRESS]),
  },
  {
    name: "getTotalSupply",
    assertion: viewSuccessAssertionFactory("getTotalSupply", ["unit"]),
  },
];

const FA2_METHODS_ASSERTIONS = [
  {
    name: "update_operators",
    assertion: signatureAssertionFactory("update_operators", ["list"]),
  },
  {
    name: "transfer",
    assertion: signatureAssertionFactory("transfer", ["list"]),
  },
  {
    name: "balance_of",
    assertion: (
      contract: WalletContract,
      tezos: TezosToolkit,
      tokenId: number
    ) =>
      viewSuccessAssertionFactory("balance_of", [
        [{ owner: STUB_TEZOS_ADDRESS, token_id: String(tokenId) }],
      ])(contract, tezos),
  },
];

export async function assertTokenType(
  tokenType: ThanosAssetType.FA1_2,
  contract: WalletContract,
  tezos: TezosToolkit
): Promise<void>;
export async function assertTokenType(
  tokenType: ThanosAssetType.FA2,
  contract: WalletContract,
  tezos: TezosToolkit,
  tokenId: number
): Promise<void>;
export async function assertTokenType(
  tokenType: ThanosAssetType.FA1_2 | ThanosAssetType.FA2,
  contract: WalletContract,
  tezos: TezosToolkit,
  tokenId?: number
) {
  const isFA12Token = tokenType === ThanosAssetType.FA1_2;
  const assertions = isFA12Token
    ? FA12_METHODS_ASSERTIONS
    : FA2_METHODS_ASSERTIONS;
  await Promise.all(
    assertions.map(async ({ name, assertion }) => {
      if (typeof contract.methods[name] !== "function") {
        throw new NotMatchingStandardError(
          getMessage("someMethodNotDefinedInContract", name)
        );
      }
      try {
        await assertion(contract, tezos, tokenId!);
      } catch (e) {
        if (e instanceof AssertionError) {
          throw new NotMatchingStandardError(
            getMessage("someMethodSignatureDoesNotMatchStandard", name)
          );
        } else if (e.value?.string === "FA2_TOKEN_UNDEFINED") {
          throw new Error(getMessage("incorrectTokenIdErrorMessage"));
        } else {
          if (process.env.NODE_ENV === "development") {
            console.error(e);
          }
          throw new Error(
            getMessage("unknownErrorCheckingSomeEntrypoint", name)
          );
        }
      }
    })
  );
}

export async function fetchBalance(
  tezos: TezosToolkit,
  asset: ThanosAsset,
  accountPkh: string
) {
  let nat: BigNumber | undefined;

  switch (asset.type) {
    case ThanosAssetType.XTZ:
      const amount = await tezos.tz.getBalance(accountPkh);
      return mutezToTz(amount);

    case ThanosAssetType.Staker:
    case ThanosAssetType.TzBTC:
    case ThanosAssetType.FA1_2:
      const contract = await loadContractForCallLambdaView(
        tezos,
        asset.address
      );

      try {
        nat = await contract.views
          .getBalance(accountPkh)
          .read((tezos as any).lambdaContract);
      } catch { }

      if (!nat || nat.isNaN()) {
        nat = new BigNumber(0);
      }

      return nat.div(10 ** asset.decimals);

    case ThanosAssetType.FA2:
      const fa2Contract = await loadContractForCallLambdaView(
        tezos,
        asset.address
      );

      try {
        const response = await fa2Contract.views
          .balance_of([{ owner: accountPkh, token_id: asset.id }])
          .read((tezos as any).lambdaContract);
        nat = response[0].balance;
      } catch { }

      if (!nat || nat.isNaN()) {
        nat = new BigNumber(0);
      }

      return nat.div(10 ** asset.decimals);

    default:
      throw new Error("Not Supported");
  }
}

export async function toTransferParams(
  tezos: TezosToolkit,
  asset: ThanosAsset,
  fromPkh: string,
  toPkh: string,
  amount: number
) {
  switch (asset.type) {
    case ThanosAssetType.XTZ:
      return {
        to: toPkh,
        amount,
      };

    case ThanosAssetType.Staker:
    case ThanosAssetType.TzBTC:
    case ThanosAssetType.FA1_2:
    case ThanosAssetType.FA2:
      const contact = await loadContract(tezos, asset.address);
      const pennyAmount = new BigNumber(amount)
        .times(10 ** asset.decimals)
        .toString();
      const methodArgs =
        asset.type === ThanosAssetType.FA2
          ? [
            [
              {
                from_: fromPkh,
                txs: [
                  { to_: toPkh, token_id: asset.id, amount: pennyAmount },
                ],
              },
            ],
          ]
          : [fromPkh, toPkh, pennyAmount];
      return contact.methods.transfer(...methodArgs).toTransferParams();

    default:
      throw new Error("Not Supported");
  }
}

export function tryParseParameters(asset: ThanosAsset, parameters: any) {
  switch (asset.type) {
    case ThanosAssetType.Staker:
    case ThanosAssetType.TzBTC:
    case ThanosAssetType.FA1_2:
      try {
        const [{ args }, { int }] = parameters.value.args;
        const sender: string = args[0].string;
        const receiver: string = args[1].string;
        const volume = new BigNumber(int).div(10 ** asset.decimals).toNumber();
        return {
          sender,
          receiver,
          volume,
        };
      } catch (_err) {
        return null;
      }

    default:
      return null;
  }
}

export function mergeAssets<T extends ThanosAsset>(base: T[], ...rest: T[][]) {
  const uniques = new Set<string>();
  return base.concat(...rest).filter((a) => {
    const key = getAssetKey(a);
    if (uniques.has(key)) return false;
    uniques.add(key);
    return true;
  });
}

export function omitAssets<T extends ThanosAsset>(base: T[], toRemove: T[]) {
  const toRemoveSet = new Set(toRemove.map(getAssetKey));
  return base.filter((a) => !toRemoveSet.has(getAssetKey(a)));
}

export function assetsAreSame(aAsset: ThanosAsset, bAsset: ThanosAsset) {
  return getAssetKey(aAsset) === getAssetKey(bAsset);
}

export function getAssetKey(asset: ThanosAsset) {
  switch (asset.type) {
    case ThanosAssetType.XTZ:
      return "xtz";

    case ThanosAssetType.FA2:
      return `${asset.address}_${asset.id}`;

    default:
      return `${asset.address}_0`;
  }
}

export function toPenny(asset: ThanosAsset) {
  return new BigNumber(1).div(10 ** asset.decimals).toNumber();
}

export class NotMatchingStandardError extends Error { }
