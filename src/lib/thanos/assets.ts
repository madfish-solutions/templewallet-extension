import BigNumber from "bignumber.js";
import { TezosToolkit, WalletContract } from "@taquito/taquito";
import { MichelsonV1ExpressionExtended } from "@taquito/rpc";
import { ThanosAsset, ThanosToken, ThanosAssetType } from "lib/thanos/types";
import { loadContract } from "lib/thanos/contract";
import { mutezToTz } from "lib/thanos/helpers";
import assert, { AssertionError } from "lib/assert";
import { getMessage } from "lib/i18n";
import { ReactiveTezosToolkit } from "lib/thanos/front";

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

type MichelsonArgsExpression = Omit<MichelsonV1ExpressionExtended, "args"> & {
  args?: MichelsonArgsExpression[];
};

function assertArgsTypes(
  entrypointInterface: Record<string, any>,
  expression: MichelsonArgsExpression
) {
  assert(entrypointInterface.prim === expression.prim);
  const receivedArgs = entrypointInterface.args;
  const expectedArgs = expression.args;
  assert(receivedArgs?.length === expectedArgs?.length);
  receivedArgs?.forEach((receivedArg: Record<string, any>, index: number) => {
    if (expression.prim) {
      assert(
        expectedArgs!.some((expectedArg) => {
          try {
            assertArgsTypes(receivedArg, expectedArg);
            return true;
          } catch {
            return false;
          }
        })
      );
    } else {
      assertArgsTypes(receivedArg, expectedArgs![index]);
    }
  });
  if (expression.annots) {
    assert(
      expression.annots.every((requiredAnnot) => {
        return entrypointInterface.annots?.includes(requiredAnnot);
      })
    );
  }
}

function entrypointAssertionFactory(
  name: string,
  expression: MichelsonArgsExpression
) {
  return (contract: WalletContract) => {
    const entrypointInterface: Record<string, any> =
      contract.entrypoints.entrypoints[name];
    assertArgsTypes(entrypointInterface, expression);
  };
}

function viewSuccessAssertionFactory(name: string, args: any[]) {
  return async (contract: WalletContract, tezos: ReactiveTezosToolkit) => {
    await contract.views[name](...args).read(tezos.lambdaContract);
  };
}

const STUB_TEZOS_ADDRESS = "tz1TTXUmQaxe1dTLPtyD4WMQP6aKYK9C8fKw";
const FA12_METHODS_ASSERTIONS = [
  {
    name: "transfer",
    assertion: entrypointAssertionFactory("transfer", {
      prim: "pair",
      args: [
        { prim: "address" },
        {
          prim: "pair",
          args: [{ prim: "address" }, { prim: "nat" }],
        },
      ],
    }),
  },
  {
    name: "approve",
    assertion: entrypointAssertionFactory("approve", {
      prim: "pair",
      args: [{ prim: "address" }, { prim: "nat" }],
    }),
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
    assertion: entrypointAssertionFactory("update_operators", {
      prim: "list",
      args: [
        {
          prim: "or",
          args: [
            {
              prim: "pair",
              args: [
                { prim: "address" },
                {
                  prim: "pair",
                  args: [{ prim: "address" }, { prim: "nat" }],
                },
              ],
              annots: ["%remove_operator"],
            },
            {
              prim: "pair",
              args: [
                { prim: "address" },
                {
                  prim: "pair",
                  args: [{ prim: "address" }, { prim: "nat" }],
                },
              ],
              annots: ["%add_operator"],
            },
          ],
        },
      ],
    }),
  },
  {
    name: "transfer",
    assertion: entrypointAssertionFactory("transfer", {
      prim: "list",
      args: [
        {
          prim: "pair",
          args: [
            { prim: "address" },
            {
              prim: "list",
              args: [
                {
                  prim: "pair",
                  args: [
                    { prim: "address" },
                    {
                      prim: "pair",
                      args: [{ prim: "nat" }, { prim: "nat" }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  },
  {
    name: "balance_of",
    assertion: (
      contract: WalletContract,
      tezos: ReactiveTezosToolkit,
      tokenId: number
    ) =>
      viewSuccessAssertionFactory("balance_of", [
        [{ owner: STUB_TEZOS_ADDRESS, token_id: String(tokenId) }],
      ])(contract, tezos),
  },
  {
    name: "token_metadata_registry",
    assertion: entrypointAssertionFactory("token_metadata_registry", {
      prim: "contract",
      args: [{ prim: "address" }],
    }),
  },
];

export async function assertTokenType(
  tokenType: ThanosAssetType.FA1_2,
  contract: WalletContract,
  tezos: ReactiveTezosToolkit
): Promise<void>;
export async function assertTokenType(
  tokenType: ThanosAssetType.FA2,
  contract: WalletContract,
  tezos: ReactiveTezosToolkit,
  tokenId: number
): Promise<void>;
export async function assertTokenType(
  tokenType: ThanosAssetType.FA1_2 | ThanosAssetType.FA2,
  contract: WalletContract,
  tezos: ReactiveTezosToolkit,
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
          throw new Error(
            getMessage("unknownErrorCheckingSomeEntrypoint", name)
          );
        }
      }
    })
  );
}

export async function fetchBalance(
  tezos: ReactiveTezosToolkit,
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
        .read(tezos.lambdaContract);
      return nat.div(10 ** asset.decimals);
    case ThanosAssetType.FA2:
      const fa2Contract: any = await loadContract(tezos, asset.address, false);
      const response = await fa2Contract.views
        .balance_of([{ owner: accountPkh, token_id: asset.id }])
        .read(tezos.lambdaContract);
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

export class NotMatchingStandardError extends Error {}
