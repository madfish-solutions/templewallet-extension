import BigNumber from "bignumber.js";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import { ThanosAsset, ThanosToken, ThanosAssetType } from "lib/thanos/types";
import { loadContract } from "lib/thanos/contract";
import { mutezToTz } from "lib/thanos/helpers";
import assert from "lib/assert";

export const XTZ_ASSET: ThanosAsset = {
  type: ThanosAssetType.XTZ,
  name: "XTZ",
  symbol: "XTZ",
  decimals: 6,
  fungible: true,
  default: true,
};

export const MAINNET_TOKENS: ThanosToken[] = [
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
    type: ThanosAssetType.TzBTC,
    address: "KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn",
    name: "tzBTC",
    symbol: "tzBTC",
    decimals: 8,
    fungible: true,
    iconUrl:
      "https://tzbtc.io/wp-content/uploads/2020/03/tzbtc_logo_single.svg",
    default: true,
  },
];

type InterfaceTypeDescriptor = (string | InterfaceTypeDescriptor)[];

function assertArgsTypes(
  entrypointInterface: Record<string, any>,
  typeDescriptor: string | InterfaceTypeDescriptor
) {
  if (typeof typeDescriptor === "string") {
    assert(entrypointInterface.prim === typeDescriptor);
    return;
  }
  switch (typeDescriptor.length) {
    case 0:
      return;
    case 1:
      assert(entrypointInterface.prim === typeDescriptor[0]);
      return;
    default:
      if (entrypointInterface.prim === "pair") {
        assert(entrypointInterface.args.length === 2);
        assert(entrypointInterface.args[0].prim === typeDescriptor[0]);
        if (typeDescriptor.length === 2) {
          assert(entrypointInterface.args[1].prim === typeDescriptor[1]);
        } else {
          assertArgsTypes(entrypointInterface.args[1], typeDescriptor.slice(1));
        }
      } else if (entrypointInterface.prim === "list") {
        assert(entrypointInterface.args.length === 1);
        assertArgsTypes(entrypointInterface.args[0], typeDescriptor.slice(1));
      } else if (entrypointInterface.prim === "or") {
        const variants = entrypointInterface.args;
        const expectedVariants = typeDescriptor[1];
        assert(variants.length > 0);
        assert(variants.length === expectedVariants.length);
        for (let i = 0; i < variants.length; i++) {
          let matched = false;
          for (let j = 0; j < expectedVariants.length; j++) {
            try {
              assertArgsTypes(variants[i], expectedVariants[j]);
              matched = true;
            } catch (e) {}
          }
          assert(matched);
        }
      }
  }
}

function entrypointAssertionFactory(
  name: string,
  typeDescriptor: InterfaceTypeDescriptor
) {
  return (contract: WalletContract) => {
    const entrypointInterface: Record<string, any> =
      contract.entrypoints.entrypoints[name];
    assertArgsTypes(entrypointInterface, typeDescriptor);
  };
}

function viewSuccessAssertionFactory(name: string, args: any[]) {
  return async (contract: WalletContract, tezos: TezosToolkit) => {
    await contract.views[name](...args).read((tezos as any).lambdaContract);
  };
}

const STUB_TEZOS_ADDRESS = "tz1TTXUmQaxe1dTLPtyD4WMQP6aKYK9C8fKw";
const FA12_METHODS_ASSERTIONS = [
  {
    name: "transfer",
    assertion: entrypointAssertionFactory("transfer", [
      "address",
      "address",
      "nat",
    ]),
  },
  {
    name: "approve",
    assertion: entrypointAssertionFactory("approve", ["address", "nat"]),
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
    assertion: entrypointAssertionFactory("update_operators", [
      "list",
      "or",
      [
        ["address", "address", "nat"],
        ["address", "address", "nat"],
      ],
    ]),
  },
  {
    name: "transfer",
    assertion: entrypointAssertionFactory("transfer", [
      "list",
      "address",
      "list",
      "address",
      "nat",
      "nat",
    ]),
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
  {
    name: "token_metadata_registry",
    assertion: entrypointAssertionFactory("token_metadata_registry", ["contract"])
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
  const assertions =
    tokenType === ThanosAssetType.FA1_2
      ? FA12_METHODS_ASSERTIONS
      : FA2_METHODS_ASSERTIONS;
  await Promise.all(
    assertions.map(async ({ name, assertion }) => {
      if (typeof contract.methods[name] !== "function") {
        throw new Error(`'${name}' method isn't defined in contract`);
      }
      console.log(`trying ${name}`);
      await assertion(contract, tezos, tokenId!);
      console.log(`${name} passed`);
    })
  );
}

export async function fetchBalance(
  tezos: TezosToolkit,
  asset: ThanosAsset,
  accountPkh: string
) {
  switch (asset.type) {
    case ThanosAssetType.XTZ:
      const amount = await tezos.tz.getBalance(accountPkh);
      return mutezToTz(amount);

    case ThanosAssetType.Staker:
    case ThanosAssetType.TzBTC:
    case ThanosAssetType.FA1_2:
      const contract: any = await loadContract(tezos, asset.address, false);
      const nat: BigNumber = await contract.views
        .getBalance(accountPkh)
        .read((tezos as any).lambdaContract);
      return nat.div(10 ** asset.decimals);
    case ThanosAssetType.FA2:
      const fa2Contract: any = await loadContract(tezos, asset.address, false);
      const response = await fa2Contract.views
        .balance_of([{ owner: accountPkh, token_id: asset.id }])
        .read((tezos as any).lambdaContract);
      return response[0].balance.div(10 ** asset.decimals);

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

export function toPenny(asset: ThanosAsset) {
  return new BigNumber(1).div(10 ** asset.decimals).toNumber();
}
