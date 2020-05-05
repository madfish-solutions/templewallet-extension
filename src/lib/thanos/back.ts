import { Queue } from "queue-ts";
import { IntercomServer } from "lib/intercom/server";
import {
  ThanosMessageType,
  ThanosRequest,
  ThanosResponse,
} from "lib/thanos/types";
import { Vault } from "lib/thanos/back/vault";
import { toFront, store, inited } from "lib/thanos/back/store";
import * as Actions from "lib/thanos/back/actions";

const intercom = new IntercomServer();
const frontStore = store.map(toFront);

export async function start() {
  intercom.onRequest(async (req) => {
    if ("type" in req) {
      return processRequest(req as ThanosRequest);
    }
  });

  const vaultExist = await Vault.isExist();
  inited(vaultExist);

  frontStore.watch(() => {
    intercom.broadcast({ type: ThanosMessageType.StateUpdated });
  });
}

async function processRequest(
  req: ThanosRequest
): Promise<ThanosResponse | void> {
  switch (req.type) {
    case ThanosMessageType.GetStateRequest:
      const state = await Actions.getFrontState();
      return {
        type: ThanosMessageType.GetStateResponse,
        state,
      };

    case ThanosMessageType.NewWalletRequest:
      return enqueue(async () => {
        await Actions.registerNewWallet(req.password, req.mnemonic);
        return { type: ThanosMessageType.NewWalletResponse };
      });

    case ThanosMessageType.UnlockRequest:
      return enqueue(async () => {
        await Actions.unlock(req.password);
        return { type: ThanosMessageType.UnlockResponse };
      });

    case ThanosMessageType.LockRequest:
      return enqueue(async () => {
        await Actions.lock();
        return { type: ThanosMessageType.LockResponse };
      });

    case ThanosMessageType.CreateAccountRequest:
      return enqueue(async () => {
        await Actions.createHDAccount(req.name);
        return { type: ThanosMessageType.CreateAccountResponse };
      });

    case ThanosMessageType.RevealPublicKeyRequest:
      return enqueue(async () => {
        const publicKey = await Actions.revealPublicKey(
          req.accountPublicKeyHash
        );
        return {
          type: ThanosMessageType.RevealPublicKeyResponse,
          publicKey,
        };
      });

    case ThanosMessageType.RevealPrivateKeyRequest:
      return enqueue(async () => {
        const privateKey = await Actions.revealPrivateKey(
          req.accountPublicKeyHash,
          req.password
        );
        return {
          type: ThanosMessageType.RevealPrivateKeyResponse,
          privateKey,
        };
      });

    case ThanosMessageType.RevealMnemonicRequest:
      return enqueue(async () => {
        const mnemonic = await Actions.revealMnemonic(req.password);
        return {
          type: ThanosMessageType.RevealMnemonicResponse,
          mnemonic,
        };
      });

    case ThanosMessageType.RemoveAccountRequest:
      return enqueue(async () => {
        await Actions.removeAccount(req.accountPublicKeyHash, req.password);
        return {
          type: ThanosMessageType.RemoveAccountResponse,
        };
      });

    case ThanosMessageType.EditAccountRequest:
      return enqueue(async () => {
        await Actions.editAccount(req.accountPublicKeyHash, req.name);
        return {
          type: ThanosMessageType.EditAccountResponse,
        };
      });

    case ThanosMessageType.ImportAccountRequest:
      return enqueue(async () => {
        await Actions.importAccount(req.privateKey, req.encPassword);
        return {
          type: ThanosMessageType.ImportAccountResponse,
        };
      });

    case ThanosMessageType.ImportMnemonicAccountRequest:
      return enqueue(async () => {
        await Actions.importMnemonicAccount(
          req.mnemonic,
          req.password,
          req.derivationPath
        );
        return {
          type: ThanosMessageType.ImportMnemonicAccountResponse,
        };
      });

    case ThanosMessageType.ImportFundraiserAccountRequest:
      return enqueue(async () => {
        await Actions.importFundraiserAccount(
          req.email,
          req.password,
          req.mnemonic
        );
        return {
          type: ThanosMessageType.ImportFundraiserAccountResponse,
        };
      });

    case ThanosMessageType.SignRequest:
      return enqueue(async () => {
        const result = await Actions.sign(
          intercom,
          req.accountPublicKeyHash,
          req.bytes,
          req.watermark
        );
        return {
          type: ThanosMessageType.SignResponse,
          result,
        };
      });
  }
}

const queue = new Queue(1);

async function enqueue<T>(factory: () => Promise<T>) {
  if (!queue.isAvailable()) {
    await Actions.stopConfirming();
  }

  return new Promise<T>((response, reject) => {
    queue.add(() => factory().then(response).catch(reject));
  });
}
