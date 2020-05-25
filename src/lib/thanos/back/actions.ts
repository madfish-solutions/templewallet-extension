import { Buffer } from "buffer";
import { IntercomServer } from "lib/intercom/server";
import { generateSalt } from "lib/thanos/passworder";
import {
  ThanosState,
  ThanosStatus,
  ThanosMessageType,
  ThanosConfirmRequest,
} from "lib/thanos/types";
import { Vault } from "lib/thanos/back/vault";
import {
  StoreState,
  UnlockedStoreState,
  toFront,
  store,
  locked,
  unlocked,
  accountsUpdated,
} from "lib/thanos/back/store";
import {
  ThanosDAppRequest,
  ThanosDAppMessageType,
  ThanosDAppErrorType,
  ThanosDAppResponse,
  ThanosDAppPermissionResponse,
} from "../dapp/types";
import { /*Windows,*/ browser } from "webextension-polyfill-ts";

const ACCOUNT_NAME_PATTERN = /^[a-zA-Z0-9 _-]{1,16}$/;
const DAPP_CONFIRM_WIDTH = 360;
const DAPP_CONFIRM_HEIGHT = 500;
const AUTODECLINE_AFTER = 60_000;

export async function getFrontState(): Promise<ThanosState> {
  const state = store.getState();
  if (state.inited) {
    return toFront(state);
  } else {
    await new Promise((r) => setTimeout(r, 10));
    return getFrontState();
  }
}

export function registerNewWallet(password: string, mnemonic?: string) {
  return withInited(async () => {
    await Vault.spawn(password, mnemonic);
    await unlock(password);
  });
}

export function lock() {
  return withInited(async () => {
    locked();
  });
}

export function unlock(password: string) {
  return withInited(async () => {
    const vault = await Vault.setup(password);
    const accounts = await vault.fetchAccounts();
    unlocked({ vault, accounts });
  });
}

export function createHDAccount(name?: string) {
  return withUnlocked(async ({ vault }) => {
    if (name) {
      name = name.trim();
      if (!ACCOUNT_NAME_PATTERN.test(name)) {
        throw new Error(
          "Invalid name. It should be: 1-16 characters, without special"
        );
      }
    }

    const updatedAccounts = await vault.createHDAccount(name);
    accountsUpdated(updatedAccounts);
  });
}

export function revealMnemonic(password: string) {
  return withUnlocked(() => Vault.revealMnemonic(password));
}

export function revealPrivateKey(accPublicKeyHash: string, password: string) {
  return withUnlocked(() => Vault.revealPrivateKey(accPublicKeyHash, password));
}

export function revealPublicKey(accPublicKeyHash: string) {
  return withUnlocked(({ vault }) => vault.revealPublicKey(accPublicKeyHash));
}

export function removeAccount(accPublicKeyHash: string, password: string) {
  return withUnlocked(async () => {
    const updatedAccounts = await Vault.removeAccount(
      accPublicKeyHash,
      password
    );
    accountsUpdated(updatedAccounts);
  });
}

export function editAccount(accPublicKeyHash: string, name: string) {
  return withUnlocked(async ({ vault }) => {
    name = name.trim();
    if (!ACCOUNT_NAME_PATTERN.test(name)) {
      throw new Error(
        "Invalid name. It should be: 1-16 characters, without special"
      );
    }

    const updatedAccounts = await vault.editAccountName(accPublicKeyHash, name);
    accountsUpdated(updatedAccounts);
  });
}

export function importAccount(privateKey: string, encPassword?: string) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importAccount(privateKey, encPassword);
    accountsUpdated(updatedAccounts);
  });
}

export function importMnemonicAccount(
  mnemonic: string,
  password?: string,
  derivationPath?: string
) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importMnemonicAccount(
      mnemonic,
      password,
      derivationPath
    );
    accountsUpdated(updatedAccounts);
  });
}

export function importFundraiserAccount(
  email: string,
  password: string,
  mnemonic: string
) {
  return withUnlocked(async ({ vault }) => {
    const updatedAccounts = await vault.importFundraiserAccount(
      email,
      password,
      mnemonic
    );
    accountsUpdated(updatedAccounts);
  });
}

export function sign(
  intercom: IntercomServer,
  accPublicKeyHash: string,
  id: string,
  bytes: string,
  watermark?: string
) {
  return withUnlocked(
    () =>
      new Promise(async (resolve, reject) => {
        intercom.broadcast({
          type: ThanosMessageType.ConfirmRequested,
          id,
        });

        let stop: any;
        let timeout: any;

        let closing = false;
        const close = () => {
          if (closing) return;
          closing = true;

          try {
            if (stop) stop();
            if (timeout) clearTimeout(timeout);

            intercom.broadcast({
              type: ThanosMessageType.ConfirmExpired,
              id,
            });
          } catch (_err) {}
        };

        const decline = () => {
          reject(new Error("Declined"));
        };

        stop = intercom.onRequest(async (req: ThanosConfirmRequest) => {
          if (
            req?.type === ThanosMessageType.ConfirmRequest &&
            req?.id === id
          ) {
            if (req.confirm) {
              const result = await Vault.sign(
                accPublicKeyHash,
                req.password!,
                bytes,
                watermark
              );
              resolve(result);
            } else {
              decline();
            }

            close();

            return {
              type: ThanosMessageType.ConfirmResponse,
              id,
            };
          }
        });

        // Decline after timeout
        timeout = setTimeout(() => {
          decline();
          close();
        }, AUTODECLINE_AFTER);
      })
  );
}

// let currentConfirmWindow: Windows.Window;

export async function processDApp(
  _intercom: IntercomServer,
  _origin: string,
  req: ThanosDAppRequest
): Promise<ThanosDAppResponse | void> {
  switch (req?.type) {
    case ThanosDAppMessageType.PermissionRequest:
      return withInited(
        async (): Promise<ThanosDAppPermissionResponse> => {
          // if (!req.force && vault) {
          //   const dApp = await vault.resolveDApp(origin, network);
          //   if (dApp) {
          //     return {
          //       type: ThanosDAppMessageType.PermissionResponse,
          //       pkh: dApp.pkh
          //     }
          //   }
          // }
          return new Promise(async (resolve, reject) => {
            const id = Buffer.from(generateSalt()).toString("hex");
            const search = new URLSearchParams({ id, type: req.type });
            const win = await browser.windows.getCurrent();
            const top = Math.round(
              win.top! + win.height! / 2 - DAPP_CONFIRM_HEIGHT / 2
            );
            const left = Math.round(
              win.left! + win.width! / 2 - DAPP_CONFIRM_WIDTH / 2
            );
            const confirmWin = await browser.windows.create({
              type: "popup",
              url: browser.runtime.getURL(`fullpage.html?${search}`),
              width: DAPP_CONFIRM_WIDTH,
              height: DAPP_CONFIRM_HEIGHT,
              top: Math.max(top, 0),
              left: Math.max(left, 0),
            });
            // currentConfirmWindow = confirmWin;
            let stop: any;
            let timeout: any;
            let closing = false;
            const close = () => {
              if (closing) return;
              closing = true;
              try {
                if (stop) stop();
                if (timeout) clearTimeout(timeout);
                // closeWindow();
              } catch (_err) {}

              // try {
              //   const tabs = await browser.tabs.query({
              //     active: true
              //   });
              //   if (tabs.length > 0) {
              //     await browser.tabs.update(tabs[0].id, {
              //       active: true,
              //       highlighted: true
              //     });
              //   }
              // } catch (_err) {}
              // if (confirmWin.id) {
              //   try {
              //     const win = await browser.windows.get(confirmWin.id);
              //     if (win.id) {
              //       browser.windows.remove(win.id);
              //     }
              //   } catch (_err) {}
              // }
            };
            const decline = () => {
              reject(new Error(ThanosDAppErrorType.NotGranted));
            };

            // stop = intercom.onRequest(async (msg) => {
            //   if (
            //     msg?.type === ThanosMessageType.ConfirmRequest &&
            //     msg?.id === id
            //   ) {
            //     const req = msg as ThanosDAppConfirmRequest;
            //     if (req.confirm) {
            //       const result = await Vault.(
            //         accPublicKeyHash,
            //         req.password!,
            //         bytes,
            //         watermark
            //       );
            //       resolve(result);
            //     } else {
            //       decline();
            //     }
            //     close();
            //     return {
            //       type: ThanosMessageType.ConfirmResponse,
            //       id,
            //     };
            //   }
            // });
            browser.windows.onRemoved.addListener((winId) => {
              if (winId === confirmWin?.id) {
                decline();
                close();
              }
            });
            // Decline after timeout
            timeout = setTimeout(() => {
              decline();
              close();
            }, AUTODECLINE_AFTER);
          });
        }
      );
    // return {
    //   type: ThanosDAppMessageType.PermissionResponse,
    //   pkh: "",
    // };
  }
}

// export async function closeConfirmWindow() {
//   if (currentConfirmWindow?.id) {
//     try {
//       const win = await browser.windows.get(currentConfirmWindow.id);
//       if (win.id) {
//         browser.windows.remove(win.id);
//       }
//     } catch (_err) {}
//   }
// }

function withUnlocked<T>(factory: (state: UnlockedStoreState) => T) {
  const state = store.getState();
  assertUnlocked(state);
  return factory(state);
}

function withInited<T>(factory: (state: StoreState) => T) {
  const state = store.getState();
  assertInited(state);
  return factory(state);
}

function assertUnlocked(
  state: StoreState
): asserts state is UnlockedStoreState {
  assertInited(state);
  if (state.status !== ThanosStatus.Ready) {
    throw new Error("Not ready");
  }
}

function assertInited(state: StoreState) {
  if (!state.inited) {
    throw new Error("Not initialized");
  }
}
