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
    if (req?.type) {
      return processRequest(req as ThanosRequest, port);
    }
  });

  const vaultExist = await Vault.isExist();
  inited(vaultExist);

  frontStore.watch(() => {
    intercom.broadcast({ type: ThanosMessageType.StateUpdated });
  });
}

const queue = new Queue(1);
const pageQueue = new Queue(1);

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
      return enqueue(queue, port, async () => {
        await Actions.registerNewWallet(req.password, req.mnemonic);
        return { type: ThanosMessageType.NewWalletResponse };
      });

    case ThanosMessageType.UnlockRequest:
      return enqueue(queue, port, async () => {
        await Actions.unlock(req.password);
        return { type: ThanosMessageType.UnlockResponse };
      });

    case ThanosMessageType.LockRequest:
      return enqueue(queue, port, async () => {
        await Actions.lock();
        return { type: ThanosMessageType.LockResponse };
      });

    case ThanosMessageType.CreateAccountRequest:
      return enqueue(queue, port, async () => {
        await Actions.createHDAccount(req.name);
        return { type: ThanosMessageType.CreateAccountResponse };
      });

    case ThanosMessageType.RevealPublicKeyRequest:
      return enqueue(queue, port, async () => {
        const publicKey = await Actions.revealPublicKey(
          req.accountPublicKeyHash
        );
        return {
          type: ThanosMessageType.RevealPublicKeyResponse,
          publicKey,
        };
      });

    case ThanosMessageType.RevealPrivateKeyRequest:
      return enqueue(queue, port, async () => {
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
      return enqueue(queue, port, async () => {
        const mnemonic = await Actions.revealMnemonic(req.password);
        return {
          type: ThanosMessageType.RevealMnemonicResponse,
          mnemonic,
        };
      });

    case ThanosMessageType.RemoveAccountRequest:
      return enqueue(queue, port, async () => {
        await Actions.removeAccount(req.accountPublicKeyHash, req.password);
        return {
          type: ThanosMessageType.RemoveAccountResponse,
        };
      });

    case ThanosMessageType.EditAccountRequest:
      return enqueue(queue, port, async () => {
        await Actions.editAccount(req.accountPublicKeyHash, req.name);
        return {
          type: ThanosMessageType.EditAccountResponse,
        };
      });

    case ThanosMessageType.ImportAccountRequest:
      return enqueue(queue, port, async () => {
        await Actions.importAccount(req.privateKey, req.encPassword);
        return {
          type: ThanosMessageType.ImportAccountResponse,
        };
      });

    case ThanosMessageType.ImportMnemonicAccountRequest:
      return enqueue(queue, port, async () => {
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
      return enqueue(queue, port, async () => {
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
      return enqueue(queue, port, async () => {
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
      return enqueue(pageQueue, port, async () => {
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

async function enqueue<T>(
  q: Queue,
  port: Runtime.Port,
  factory: () => Promise<T>
) {
  return new Promise<T>((response, reject) => {
    let close: () => void;

    q.add(() =>
      Promise.race([
        factory()
          .then((r) => {
            response(r);
            close();
          })
          .catch((err) => {
            reject(err);
            close();
          }),
        new Promise((res) => {
          const handleDisconnect = () => {
            res();
            reject(new Error("Disconnected"));
            close();
          };
          close = () => port.onDisconnect.removeListener(handleDisconnect);
          port.onDisconnect.addListener(handleDisconnect);
        }),
      ])
    );
  });
}
