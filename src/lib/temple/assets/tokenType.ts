import { TezosToolkit, WalletContract } from "@taquito/taquito";
import retry from "async-retry";

import assert from "lib/assert";
import { getMessage } from "lib/i18n";

const STUB_TEZOS_ADDRESS = "tz1TTXUmQaxe1dTLPtyD4WMQP6aKYK9C8fKw";

export async function assertGetBalance(
  tezos: TezosToolkit,
  contract: WalletContract,
  type: "fa1.2" | "fa2",
  fa2TokenId = 0
) {
  try {
    await retry(
      () =>
        type === "fa2"
          ? contract.views
              .balance_of([{ owner: STUB_TEZOS_ADDRESS, token_id: fa2TokenId }])
              .read((tezos as any).lambdaContract)
          : contract.views
              .getBalance(STUB_TEZOS_ADDRESS)
              .read((tezos as any).lambdaContract),
      { retries: 3, minTimeout: 0, maxTimeout: 0 }
    );
  } catch (err) {
    if (err?.value?.string === "FA2_TOKEN_UNDEFINED") {
      throw new IncorrectTokenIdError(
        getMessage("incorrectTokenIdErrorMessage")
      );
    } else {
      throw new Error(
        getMessage(
          "unknownErrorCheckingSomeEntrypoint",
          type === "fa2" ? "balance_of" : "getBalance"
        )
      );
    }
  }
}

export function assertTokenType(
  contract: WalletContract,
  type: "fa1.2" | "fa2"
) {
  const assertions =
    type === "fa2" ? FA2_METHODS_ASSERTIONS : FA1_2_METHODS_ASSERTIONS;

  for (const { name, assertion } of assertions) {
    if (typeof contract.methods[name] !== "function") {
      throw new NotMatchingStandardError(
        getMessage("someMethodNotDefinedInContract", name)
      );
    }

    assertion(contract);
  }
}

export class NotMatchingStandardError extends Error {}
export class IncorrectTokenIdError extends NotMatchingStandardError {}

const FA1_2_METHODS_ASSERTIONS = [
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
    assertion: signatureAssertionFactory("getAllowance", [
      "address",
      "address",
      "contract",
    ]),
  },
  {
    name: "getBalance",
    assertion: signatureAssertionFactory("getBalance", ["address", "contract"]),
  },
  {
    name: "getTotalSupply",
    assertion: signatureAssertionFactory("getTotalSupply", [
      "unit",
      "contract",
    ]),
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
