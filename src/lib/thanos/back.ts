import { Runtime } from "webextension-polyfill-ts";
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
  intercom.onRequest(async (req, port) => {
    if ("type" in req) {
      return processRequest(req as ThanosRequest, port);
    }
  });

  const vaultExist = await Vault.isExist();
  inited(vaultExist);

  frontStore.watch(() => {
    intercom.broadcast({ type: ThanosMessageType.StateUpdated });
  });
}

async function processRequest(
  req: ThanosRequest,
  port: Runtime.Port
): Promise<ThanosResponse | void> {
  switch (req.type) {
    case ThanosMessageType.GetStateRequest:
      const state = await Actions.getFrontState();
      return {
        type: ThanosMessageType.GetStateResponse,
        state,
      };

    case ThanosMessageType.NewWalletRequest:
      return enqueue(port, async () => {
        await Actions.registerNewWallet(req.password, req.mnemonic);
        return { type: ThanosMessageType.NewWalletResponse };
      });

    case ThanosMessageType.UnlockRequest:
      return enqueue(port, async () => {
        await Actions.unlock(req.password);
        return { type: ThanosMessageType.UnlockResponse };
      });

    case ThanosMessageType.LockRequest:
      return enqueue(port, async () => {
        await Actions.lock();
        return { type: ThanosMessageType.LockResponse };
      });

    case ThanosMessageType.CreateAccountRequest:
      return enqueue(port, async () => {
        await Actions.createHDAccount(req.name);
        return { type: ThanosMessageType.CreateAccountResponse };
      });

    case ThanosMessageType.RevealPublicKeyRequest:
      return enqueue(port, async () => {
        const publicKey = await Actions.revealPublicKey(
          req.accountPublicKeyHash
        );
        return {
          type: ThanosMessageType.RevealPublicKeyResponse,
          publicKey,
        };
      });

    case ThanosMessageType.RevealPrivateKeyRequest:
      return enqueue(port, async () => {
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
      return enqueue(port, async () => {
        const mnemonic = await Actions.revealMnemonic(req.password);
        return {
          type: ThanosMessageType.RevealMnemonicResponse,
          mnemonic,
        };
      });

    case ThanosMessageType.RemoveAccountRequest:
      return enqueue(port, async () => {
        await Actions.removeAccount(req.accountPublicKeyHash, req.password);
        return {
          type: ThanosMessageType.RemoveAccountResponse,
        };
      });

    case ThanosMessageType.EditAccountRequest:
      return enqueue(port, async () => {
        await Actions.editAccount(req.accountPublicKeyHash, req.name);
        return {
          type: ThanosMessageType.EditAccountResponse,
        };
      });

    case ThanosMessageType.ImportAccountRequest:
      return enqueue(port, async () => {
        await Actions.importAccount(req.privateKey, req.encPassword);
        return {
          type: ThanosMessageType.ImportAccountResponse,
        };
      });

    case ThanosMessageType.ImportMnemonicAccountRequest:
      return enqueue(port, async () => {
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
      return enqueue(port, async () => {
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
      return enqueue(port, async () => {
        const result = await Actions.sign(
          intercom,
          req.accountPublicKeyHash,
          req.id,
          req.bytes,
          req.watermark
        );
        return {
          type: ThanosMessageType.SignResponse,
          result,
        };
      });

    case ThanosMessageType.PageRequest:
      return enqueue(port, async () => {
        const resPayload = await Actions.processDApp(
          intercom,
          req.origin,
          req.payload
        );
        return {
          type: ThanosMessageType.PageResponse,
          payload: resPayload,
        };
      });
  }
}

const queue = new Queue(1);

async function enqueue<T>(port: Runtime.Port, factory: () => Promise<T>) {
  return new Promise<T>((response, reject) => {
    queue.add(() =>
      Promise.race([
        factory().then(response).catch(reject),
        new Promise((res) => {
          port.onDisconnect.addListener(() => {
            res();
            reject(new Error("Disconnected"));
          });
        }),
      ])
    );
  });
}
