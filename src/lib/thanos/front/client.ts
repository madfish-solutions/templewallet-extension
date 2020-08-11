import * as React from "react";
import constate from "constate";
import {
  WalletProvider,
  createOriginationOperation,
  createSetDelegateOperation,
  createTransferOperation,
  WalletDelegateParams,
  WalletOriginateParams,
  WalletTransferParams,
} from "@taquito/taquito";
import { buf2hex } from "@taquito/utils";
import { nanoid } from "nanoid";
import { useRetryableSWR } from "lib/swr";
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

  const getDAppPayload = React.useCallback(async (id: string) => {
    const res = await request({
      type: ThanosMessageType.DAppGetPayloadRequest,
      id,
    });
    assertResponse(res.type === ThanosMessageType.DAppGetPayloadResponse);
    return res.payload;
  }, []);

  const confirmDAppPermission = React.useCallback(
    async (id: string, confirmed: boolean, pkh: string) => {
      const res = await request({
        type: ThanosMessageType.DAppPermConfirmationRequest,
        id,
        confirmed,
        accountPublicKeyHash: pkh,
        accountPublicKey: await getPublicKey(pkh),
      });
      assertResponse(
        res.type === ThanosMessageType.DAppPermConfirmationResponse
      );
    },
    []
  );

  const confirmDAppOperation = React.useCallback(
    async (id: string, confirmed: boolean) => {
      const res = await request({
        type: ThanosMessageType.DAppOpsConfirmationRequest,
        id,
        confirmed,
      });
      assertResponse(
        res.type === ThanosMessageType.DAppOpsConfirmationResponse
      );
    },
    []
  );

  const createWallet = React.useCallback(
    (accountPublicKeyHash: string) =>
      new TaquitoWallet(accountPublicKeyHash, (id) => {
        confirmationIdRef.current = id;
      }),
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
    getDAppPayload,
    confirmDAppPermission,
    confirmDAppOperation,
    createWallet,
    createSigner,
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

class TaquitoWallet implements WalletProvider {
  constructor(
    private pkh: string,
    private onBeforeSend?: (id: string) => void
  ) {}

  async getPKH() {
    return this.pkh;
  }

  async mapTransferParamsToWalletParams(params: WalletTransferParams) {
    return createTransferOperation(params);
  }

  async mapOriginateParamsToWalletParams(params: WalletOriginateParams) {
    return createOriginationOperation(params as any);
  }

  async mapDelegateParamsToWalletParams(params: WalletDelegateParams) {
    return createSetDelegateOperation(params as any);
  }

  async sendOperations(opParams: any[]) {
    const id = nanoid();
    if (this.onBeforeSend) {
      this.onBeforeSend(id);
    }
    const res = await request({
      type: ThanosMessageType.OperationsRequest,
      id,
      accountPublicKeyHash: this.pkh,
      opParams: opParams.map(formatOpParams),
    });
    assertResponse(res.type === ThanosMessageType.OperationsResponse);
    return res.opHash;
  }
}

function formatOpParams(op: any) {
  const { fee, gas_limit, storage_limit, ...rest } = op;
  if (op.kind === "transaction") {
    const { destination, amount, parameters, ...txRest } = rest;
    return {
      ...txRest,
      to: destination,
      amount: +amount,
      mutez: true,
      parameter: parameters,
    };
  }
  return rest;
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
