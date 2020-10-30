import BigNumber from "bignumber.js";
import { TezosToolkit } from "@taquito/taquito";
import { Uint8ArrayConsumer } from "@taquito/local-forging/dist/lib/uint8array-consumer";
import { valueDecoder } from "@taquito/local-forging/dist/lib/michelson/codec";
import { ThanosAsset, ThanosToken, ThanosAssetType } from "lib/thanos/types";
import { loadContract } from "lib/thanos/contract";

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

export async function fetchBalance(
  tezos: TezosToolkit,
  asset: ThanosAsset,
  accountPkh: string
) {
  let ledger, nat: BigNumber;
  switch (asset.type) {
    case ThanosAssetType.XTZ:
      const amount = await tezos.tz.getBalance(accountPkh);
      return tezos.format("mutez", "tz", amount) as BigNumber;

    case ThanosAssetType.Staker:
      const staker = await loadContract(tezos, asset.address);
      ledger = (await staker.storage<any>())[7];
      nat = await ledger.get(accountPkh);
      return nat ?? new BigNumber(0);

    case ThanosAssetType.TzBTC:
      const tzBtc = await loadContract(tezos, asset.address);
      ledger = (await tzBtc.storage<any>())[0];
      const { packed } = await tezos.rpc.packData({
        type: { prim: "pair", args: [{ prim: "string" }, { prim: "address" }] },
        data: {
          prim: "Pair",
          args: [{ string: "ledger" }, { string: accountPkh }],
        },
      });
      const bytes = await ledger.get(packed);
      if (!bytes) {
        return new BigNumber(0);
      }
      const val = valueDecoder(
        Uint8ArrayConsumer.fromHexString(bytes.slice(2))
      );
      return new BigNumber(val.args[0].int).div(10 ** asset.decimals);

    case ThanosAssetType.FA1_2:
      const fa1_2 = await loadContract(tezos, asset.address);
      const storage = await fa1_2.storage<any>();
      ledger = storage.ledger || storage.accounts;
      nat = (await ledger.get(accountPkh))?.balance;
      return nat ? nat.div(10 ** asset.decimals) : new BigNumber(0);

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
