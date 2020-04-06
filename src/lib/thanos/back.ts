import { Queue } from "queue-ts";
import { IntercomServer } from "lib/intercom/server";
import {
  ThanosMessageType,
  ThanosRequest,
  ThanosResponse
} from "lib/thanos/types";
import { Vault } from "lib/thanos/back/vault";
import { toFront, store, inited } from "lib/thanos/back/store";
import * as Actions from "lib/thanos/back/actions";

const intercom = new IntercomServer();
const requestQueue = new Queue(1);
const frontStore = store.map(toFront);

export async function start() {
  intercom.onRequest(handleRequest);

  const vaultExist = await Vault.isExist();
  inited(vaultExist);

  frontStore.watch(() => {
    intercom.broadcast({ type: ThanosMessageType.StateUpdated });
  });
}

async function handleRequest(req: any) {
  if ("type" in req) {
    return new Promise((response, reject) => {
      requestQueue.add(() =>
        processRequest(req as ThanosRequest)
          .then(response)
          .catch(reject)
      );
    });
  }
}

async function processRequest(
  req: ThanosRequest
): Promise<ThanosResponse | void> {
  switch (req.type) {
    case ThanosMessageType.GetStateRequest:
      const state = await Actions.getFrontState();
      return {
        type: ThanosMessageType.GetStateResponse,
        state
      };

    case ThanosMessageType.NewWalletRequest:
      await Actions.registerNewWallet(req.password, req.mnemonic);
      return { type: ThanosMessageType.NewWalletResponse };

    case ThanosMessageType.UnlockRequest:
      await Actions.unlock(req.password);
      return { type: ThanosMessageType.UnlockResponse };

    case ThanosMessageType.LockRequest:
      await Actions.lock();
      return { type: ThanosMessageType.LockResponse };

    case ThanosMessageType.CreateAccountRequest:
      await Actions.createHDAccount(req.name);
      return { type: ThanosMessageType.CreateAccountResponse };

    case ThanosMessageType.RevealPublicKeyRequest:
      const publicKey = await Actions.revealPublicKey(req.accountPublicKeyHash);
      return {
        type: ThanosMessageType.RevealPublicKeyResponse,
        publicKey
      };

    case ThanosMessageType.RevealPrivateKeyRequest:
      const privateKey = await Actions.revealPrivateKey(
        req.accountPublicKeyHash,
        req.password
      );
      return {
        type: ThanosMessageType.RevealPrivateKeyResponse,
        privateKey
      };

    case ThanosMessageType.RevealMnemonicRequest:
      const mnemonic = await Actions.revealMnemonic(req.password);
      return {
        type: ThanosMessageType.RevealMnemonicResponse,
        mnemonic
      };

    case ThanosMessageType.EditAccountRequest:
      await Actions.editAccount(req.accountPublicKeyHash, req.name);
      return {
        type: ThanosMessageType.EditAccountResponse
      };

    case ThanosMessageType.ImportAccountRequest:
      await Actions.importAccount(req.privateKey);
      return {
        type: ThanosMessageType.ImportAccountResponse
      };

    case ThanosMessageType.ImportFundraiserAccountRequest:
      await Actions.importFundraiserAccount(
        req.email,
        req.password,
        req.mnemonic
      );
      return {
        type: ThanosMessageType.ImportFundraiserAccountResponse
      };

    case ThanosMessageType.SignRequest:
      const result = await Actions.sign(
        intercom,
        req.accountPublicKeyHash,
        req.bytes,
        req.watermark
      );
      return {
        type: ThanosMessageType.SignResponse,
        result
      };
  }
}
