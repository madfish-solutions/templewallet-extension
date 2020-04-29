import * as React from "react";
import constate from "constate";
import { useRetryableSWR } from "lib/swr";
import { buf2hex } from "@taquito/utils";
import toBuffer from "typedarray-to-buffer";
import { IntercomClient } from "lib/intercom";
import { useStorage } from "lib/thanos/front/storage";
import {
  ThanosMessageType,
  ThanosStatus,
  ThanosRequest,
  ThanosResponse,
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

  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const waitingConfirmRef = React.useRef(false);

  React.useEffect(() => {
    return intercom.subscribe((msg) => {
      switch (msg?.type) {
        case ThanosMessageType.StateUpdated:
          revalidate();
          break;

        case ThanosMessageType.ConfirmRequested:
          if (waitingConfirmRef.current) {
            setConfirmId((msg as any).id);
          }
          break;

        case ThanosMessageType.ConfirmExpired:
          waitingConfirmRef.current = false;
          setConfirmId(null);
          break;
      }
    });
  }, [revalidate, setConfirmId]);

  /**
   * Aliases
   */

  const { status, accounts, networks } = state;
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

  const confirmOperation = React.useCallback(
    async (id: string, confirm: boolean, password?: string) => {
      const res = await request({
        type: ThanosMessageType.ConfirmRequest,
        id,
        confirm,
        password,
      });
      assertResponse(res.type === ThanosMessageType.ConfirmResponse);
    },
    []
  );

  const createSigner = React.useCallback(
    (accountPublicKeyHash: string) =>
      new ThanosSigner(accountPublicKeyHash, () => {
        waitingConfirmRef.current = true;
      }),
    []
  );

  return {
    state,

    // Aliases
    status,
    networks,
    accounts,
    idle,
    locked,
    ready,

    // Misc
    confirmId,
    setConfirmId,
    seedRevealed,
    setSeedRevealed,

    // Actions
    registerWallet,
    unlock,
    lock,
    createAccount,
    revealPrivateKey,
    revealMnemonic,
    editAccountName,
    importAccount,
    importMnemonicAccount,
    importFundraiserAccount,
    confirmOperation,
    createSigner,
  };
});

class ThanosSigner {
  constructor(
    private accountPublicKeyHash: string,
    private onBeforeSign?: () => void
  ) {}

  async publicKeyHash() {
    return this.accountPublicKeyHash;
  }

  async publicKey(): Promise<string> {
    const res = await request({
      type: ThanosMessageType.RevealPublicKeyRequest,
      accountPublicKeyHash: this.accountPublicKeyHash,
    });
    assertResponse(res.type === ThanosMessageType.RevealPublicKeyResponse);
    return res.publicKey;
  }

  async secretKey(): Promise<string> {
    throw new Error("Secret key cannot be exposed");
  }

  async sign(bytes: string, watermark?: Uint8Array) {
    if (this.onBeforeSign) {
      this.onBeforeSign();
    }
    const res = await request({
      type: ThanosMessageType.SignRequest,
      accountPublicKeyHash: this.accountPublicKeyHash,
      bytes,
      watermark: buf2hex(toBuffer(watermark)),
    });
    assertResponse(res.type === ThanosMessageType.SignResponse);
    return res.result;
  }
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
