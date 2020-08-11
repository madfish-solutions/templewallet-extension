import * as React from "react";
import constate from "constate";
import { nanoid } from "nanoid";
import { useRetryableSWR } from "lib/swr";
import { buf2hex } from "@taquito/utils";
import toBuffer from "typedarray-to-buffer";
import { IntercomClient } from "lib/intercom";
import { useStorage } from "lib/thanos/front";
import {
  ThanosMessageType,
  ThanosStatus,
  ThanosRequest,
  ThanosResponse,
  ThanosNotification,
  ThanosSettings,
} from "lib/thanos/types";

const intercom = new IntercomClient();

export const [ThanosClientProvider, useThanosClient] = constate(() => {
  /**
   * State
   */

  const fetchState = React.useCallback(async () => {
    const res = await request({ type: ThanosMessageType.GetStateRequest });
    assertResponse(res.type === ThanosMessageType.GetStateResponse);
    return res.state;
  }, []);

  const { data, revalidate } = useRetryableSWR("state", fetchState, {
    suspense: true,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
  const state = data!;

  const [confirmationId, setConfirmationId] = React.useState<string | null>(
    null
  );
  const confirmationIdRef = React.useRef(confirmationId);
  const resetConfirmationId = React.useCallback(() => {
    confirmationIdRef.current = null;
    setConfirmationId(null);
  }, [setConfirmationId]);

  React.useEffect(() => {
    return intercom.subscribe((msg: ThanosNotification) => {
      switch (msg?.type) {
        case ThanosMessageType.StateUpdated:
          revalidate();
          break;

        case ThanosMessageType.ConfirmationRequested:
          if (msg.id === confirmationIdRef.current) {
            setConfirmationId(msg.id);
          }
          break;

        case ThanosMessageType.ConfirmationExpired:
          if (msg.id === confirmationIdRef.current) {
            resetConfirmationId();
          }
          break;
      }
    });
  }, [revalidate, setConfirmationId, resetConfirmationId]);

  /**
   * Aliases
   */

  const { status, networks, accounts, settings } = state;
  const idle = status === ThanosStatus.Idle;
  const locked = status === ThanosStatus.Locked;
  const ready = status === ThanosStatus.Ready;

  /**
   * Backup seed phrase flag
   */
  const [seedRevealed, setSeedRevealed] = useStorage("seed_revealed", true);

  /**
   * Actions
   */

  const registerWallet = React.useCallback(
    async (password: string, mnemonic?: string) => {
      const res = await request({
        type: ThanosMessageType.NewWalletRequest,
        password,
        mnemonic,
      });
      assertResponse(res.type === ThanosMessageType.NewWalletResponse);
    },
    []
  );

  const unlock = React.useCallback(async (password: string) => {
    const res = await request({
      type: ThanosMessageType.UnlockRequest,
      password,
    });
    assertResponse(res.type === ThanosMessageType.UnlockResponse);
  }, []);

  const lock = React.useCallback(async () => {
    const res = await request({
      type: ThanosMessageType.LockRequest,
    });
    assertResponse(res.type === ThanosMessageType.LockResponse);
  }, []);

  const createAccount = React.useCallback(async (name?: string) => {
    const res = await request({
      type: ThanosMessageType.CreateAccountRequest,
      name,
    });
    assertResponse(res.type === ThanosMessageType.CreateAccountResponse);
  }, []);

  const revealPrivateKey = React.useCallback(
    async (accountPublicKeyHash: string, password: string) => {
      const res = await request({
        type: ThanosMessageType.RevealPrivateKeyRequest,
        accountPublicKeyHash,
        password,
      });
      assertResponse(res.type === ThanosMessageType.RevealPrivateKeyResponse);
      return res.privateKey;
    },
    []
  );

  const revealMnemonic = React.useCallback(async (password: string) => {
    const res = await request({
      type: ThanosMessageType.RevealMnemonicRequest,
      password,
    });
    assertResponse(res.type === ThanosMessageType.RevealMnemonicResponse);
    return res.mnemonic;
  }, []);

  const removeAccount = React.useCallback(
    async (accountPublicKeyHash: string, password: string) => {
      const res = await request({
        type: ThanosMessageType.RemoveAccountRequest,
        accountPublicKeyHash,
        password,
      });
      assertResponse(res.type === ThanosMessageType.RemoveAccountResponse);
    },
    []
  );

  const editAccountName = React.useCallback(
    async (accountPublicKeyHash: string, name: string) => {
      const res = await request({
        type: ThanosMessageType.EditAccountRequest,
        accountPublicKeyHash,
        name,
      });
      assertResponse(res.type === ThanosMessageType.EditAccountResponse);
    },
    []
  );

  const importAccount = React.useCallback(
    async (privateKey: string, encPassword?: string) => {
      const res = await request({
        type: ThanosMessageType.ImportAccountRequest,
        privateKey,
        encPassword,
      });
      assertResponse(res.type === ThanosMessageType.ImportAccountResponse);
    },
    []
  );

  const importMnemonicAccount = React.useCallback(
    async (mnemonic: string, password?: string, derivationPath?: string) => {
      const res = await request({
        type: ThanosMessageType.ImportMnemonicAccountRequest,
        mnemonic,
        password,
        derivationPath,
      });
      assertResponse(
        res.type === ThanosMessageType.ImportMnemonicAccountResponse
      );
    },
    []
  );

  const importFundraiserAccount = React.useCallback(
    async (email: string, password: string, mnemonic: string) => {
      const res = await request({
        type: ThanosMessageType.ImportFundraiserAccountRequest,
        email,
        password,
        mnemonic,
      });
      assertResponse(
        res.type === ThanosMessageType.ImportFundraiserAccountResponse
      );
    },
    []
  );

  const updateSettings = React.useCallback(
    async (settings: Partial<ThanosSettings>) => {
      const res = await request({
        type: ThanosMessageType.UpdateSettingsRequest,
        settings,
      });
      assertResponse(res.type === ThanosMessageType.UpdateSettingsResponse);
    },
    []
  );

  const confirmInternal = React.useCallback(
    async (id: string, confirmed: boolean) => {
      const res = await request({
        type: ThanosMessageType.ConfirmationRequest,
        id,
        confirmed,
      });
      assertResponse(res.type === ThanosMessageType.ConfirmationResponse);
    },
    []
  );

  const confirmDAppPermission = React.useCallback(
    async (id: string, confirm: boolean, pkh?: string, publicKey?: string) => {
      const res = await request({
        type: ThanosMessageType.DAppPermissionConfirmRequest,
        id,
        confirm,
        pkh,
        publicKey,
      });
      assertResponse(
        res.type === ThanosMessageType.DAppPermissionConfirmResponse
      );
    },
    []
  );

  const confirmDAppOperation = React.useCallback(
    async (id: string, confirm: boolean, password?: string) => {
      const res = await request({
        type: ThanosMessageType.DAppOperationConfirmRequest,
        id,
        confirm,
        password,
      });
      assertResponse(
        res.type === ThanosMessageType.DAppOperationConfirmResponse
      );
    },
    []
  );

  const createSigner = React.useCallback(
    (accountPublicKeyHash: string) =>
      new ThanosSigner(accountPublicKeyHash, (id) => {
        confirmationIdRef.current = id;
      }),
    []
  );

  return {
    state,

    // Aliases
    status,
    networks,
    accounts,
    settings,
    idle,
    locked,
    ready,

    // Misc
    confirmationId,
    resetConfirmationId,
    seedRevealed,
    setSeedRevealed,

    // Actions
    registerWallet,
    unlock,
    lock,
    createAccount,
    revealPrivateKey,
    revealMnemonic,
    removeAccount,
    editAccountName,
    importAccount,
    importMnemonicAccount,
    importFundraiserAccount,
    updateSettings,
    confirmInternal,
    confirmDAppPermission,
    confirmDAppOperation,
    createSigner,
    getPublicKey,
  };
});

class ThanosSigner {
  constructor(
    private accountPublicKeyHash: string,
    private onBeforeSign?: (id: string) => void
  ) {}

  async publicKeyHash() {
    return this.accountPublicKeyHash;
  }

  async publicKey(): Promise<string> {
    return getPublicKey(this.accountPublicKeyHash);
  }

  async secretKey(): Promise<string> {
    throw new Error("Secret key cannot be exposed");
  }

  async sign(bytes: string, watermark?: Uint8Array) {
    const id = nanoid();
    if (this.onBeforeSign) {
      this.onBeforeSign(id);
    }
    const res = await request({
      type: ThanosMessageType.SignRequest,
      accountPublicKeyHash: this.accountPublicKeyHash,
      id,
      bytes,
      watermark: buf2hex(toBuffer(watermark)),
    });
    assertResponse(res.type === ThanosMessageType.SignResponse);
    return res.result;
  }
}

async function getPublicKey(accountPublicKeyHash: string) {
  const res = await request({
    type: ThanosMessageType.RevealPublicKeyRequest,
    accountPublicKeyHash,
  });
  assertResponse(res.type === ThanosMessageType.RevealPublicKeyResponse);
  return res.publicKey;
}

async function request<T extends ThanosRequest>(req: T) {
  const res = await intercom.request(req);
  assertResponse("type" in res);
  return res as ThanosResponse;
}

function assertResponse(condition: any): asserts condition {
  if (!condition) {
    throw new Error("Invalid response recieved");
  }
}
