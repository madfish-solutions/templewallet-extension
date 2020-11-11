import BigNumber from "bignumber.js";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import { ThanosAsset, ThanosToken, ThanosAssetType } from "lib/thanos/types";
import { loadContract } from "lib/thanos/contract";
import { mutezToTz } from "lib/thanos/helpers";

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

const STUB_TEZOS_ADDRESS = "tz1TTXUmQaxe1dTLPtyD4WMQP6aKYK9C8fKw";
const FA12_METHODS_ASSERTIONS = [
  {
    name: "transfer",
    additionalAssertion: () => true,
  },
  {
    name: "approve",
    additionalAssertion: () => true,
  },
  {
    name: "getAllowance",
    additionalAssertion: (contract: WalletContract) =>
      contract.methods.getAllowance(
        STUB_TEZOS_ADDRESS,
        STUB_TEZOS_ADDRESS,
        contract
      ),
  },
  {
    name: "getBalance",
    additionalAssertion: (contract: WalletContract) =>
      contract.methods.getBalance(STUB_TEZOS_ADDRESS, contract),
  },
  {
    name: "getTotalSupply",
    additionalAssertion: (contract: WalletContract) =>
      contract.methods.getTotalSupply(contract.address, contract),
  },
];

export async function assertFA12Token(contract: WalletContract) {
  await Promise.all(
    FA12_METHODS_ASSERTIONS.map(async ({ name, additionalAssertion }) => {
      if (typeof contract.methods[name] !== "function") {
        throw new Error(`'${name}' method isn't defined in contract`);
      }
      await additionalAssertion(contract);
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
      const contact = await loadContract(tezos, asset.address);
      return contact.methods
        .transfer(
          fromPkh,
          toPkh,
          new BigNumber(amount).times(10 ** asset.decimals).toString()
        )
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
