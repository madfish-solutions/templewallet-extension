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
  fnInterface: Record<string, any>,
  types: string | InterfaceTypeDescriptor
) {
  if (typeof types === "string") {
    assert(fnInterface.prim === types);
    return;
  }
  if (types.length < 2) {
    return;
  }
  if (fnInterface.prim === "pair") {
    assert(fnInterface.args.length === 2);
    assert(fnInterface.args[0].prim === types[0]);
    if (types.length === 2) {
      assert(fnInterface.args[1].prim === types[1]);
    } else {
      assertArgsTypes(fnInterface.args[1], types.slice(1));
    }
  } else if (fnInterface.prim === "list") {
    assert(fnInterface.args.length === 1);
    assertArgsTypes(fnInterface.args[0], types.slice(1));
  } else if (fnInterface.prim === "or") {
    const variants = fnInterface.args;
    const expectedVariants = types[1];
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

const STUB_TEZOS_ADDRESS = "tz1TTXUmQaxe1dTLPtyD4WMQP6aKYK9C8fKw";
const FA12_METHODS_ASSERTIONS = [
  {
    name: "transfer",
    assertion: (contract: WalletContract) => {
      const transferInterface: Record<string, any> =
        contract.entrypoints.entrypoints.transfer;
      assertArgsTypes(transferInterface, ["address", "address", "nat"]);
    },
  },
  {
    name: "approve",
    assertion: (contract: WalletContract) => {
      const approveInterface: Record<string, any> =
        contract.entrypoints.entrypoints.approve;
      assertArgsTypes(approveInterface, ["address", "nat"]);
    },
  },
  {
    name: "getAllowance",
    assertion: (contract: WalletContract, tezos: TezosToolkit) =>
      contract.views
        .getAllowance(STUB_TEZOS_ADDRESS, STUB_TEZOS_ADDRESS)
        .read((tezos as any).lambdaContract),
  },
  {
    name: "getBalance",
    assertion: (contract: WalletContract, tezos: TezosToolkit) =>
      contract.views
        .getBalance(STUB_TEZOS_ADDRESS)
        .read((tezos as any).lambdaContract),
  },
  {
    name: "getTotalSupply",
    assertion: (contract: WalletContract, tezos: TezosToolkit) =>
      contract.views.getTotalSupply("unit").read((tezos as any).lambdaContract),
  },
];
const FA2_METHODS_ASSERTIONS = [
  {
    name: "update_operators",
    assertion: (contract: WalletContract) => {
      const transferInterface: Record<string, any> =
        contract.entrypoints.entrypoints.update_operators;
      assertArgsTypes(transferInterface, [
        "list",
        "or",
        [
          ["address", "address", "nat"],
          ["address", "address", "nat"],
        ],
      ]);
    },
  },
];

export async function assertTokenType(
  tokenType: ThanosAssetType.FA1_2 | ThanosAssetType.FA2,
  contract: WalletContract,
  tezos: TezosToolkit
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
      await assertion(contract, tezos);
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
      const pennyAmount = new BigNumber(amount).times(10 ** asset.decimals).toString();
      const methodArgs = asset.type === ThanosAssetType.FA2 ? [
        [{ from_: fromPkh, txs: [{ to_: toPkh, token_id: asset.id, amount: pennyAmount }]}]
      ] : [
        fromPkh,
        toPkh,
        pennyAmount
      ];
      return contact.methods
        .transfer(...methodArgs)
        .toTransferParams();

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
