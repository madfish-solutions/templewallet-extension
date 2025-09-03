import { useCallback, useEffect, useRef } from 'react';

import { ExchangeClient, HttpTransport, InfoClient, SubscriptionClient, WebSocketTransport } from '@nktkas/hyperliquid';
import { AbstractViemLocalAccount } from '@nktkas/hyperliquid/script/src/signing/_signTypedData/viem';
import { Mutex } from 'async-mutex';
import constate from 'constate';
import { TypedDataDefinition } from 'viem';

import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { useTypedSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { COMMON_MAINNET_CHAIN_IDS } from 'lib/temple/types';
import { isAccountOfActableType } from 'temple/accounts';
import { useAccountForEvm, useAllEvmChains } from 'temple/front';

class NonceManager {
  /** The last nonce used for signing transactions. */
  private lastNonce = 0;

  get lastReturnedNonce(): number {
    return this.lastNonce;
  }

  /**
   * Gets the next nonce for signing transactions.
   * @returns The next nonce.
   */
  getNonce(): number {
    let nonce = Date.now();
    if (nonce <= this.lastNonce) {
      nonce = ++this.lastNonce;
    } else {
      this.lastNonce = nonce;
    }

    return nonce;
  }
}
export const nonceManager = new NonceManager();

export const nonceActionsMutex = new Mutex();

export const [HyperliquidClientsProvider, useClients] = constate(() => {
  const evmAccount = useAccountForEvm();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const { [COMMON_MAINNET_CHAIN_IDS.arbitrum]: arbitrum } = useAllEvmChains();
  const { signEvmTypedData } = useTempleClient();

  const getClients = useCallback(async () => {
    let wallet: AbstractViemLocalAccount | undefined;
    if (evmAccount && isAccountOfActableType(evmAccount)) {
      const account = evmAccount.address as HexString;
      wallet = {
        address: account,
        signTypedData: async params => signEvmTypedData(params as unknown as TypedDataDefinition, account)
      };
    }

    return {
      exchange: wallet
        ? new ExchangeClient({
            transport: new HttpTransport({ isTestnet: testnetModeEnabled }),
            wallet,
            nonceManager: nonceManager.getNonce.bind(nonceManager)
          })
        : undefined,
      info: new InfoClient({
        transport: new HttpTransport({ isTestnet: testnetModeEnabled })
      }),
      subscription: new SubscriptionClient({
        transport: new WebSocketTransport({
          url: testnetModeEnabled ? 'wss://api.hyperliquid-testnet.xyz/ws' : 'wss://api.hyperliquid.xyz/ws',
          autoResubscribe: true,
          reconnect: {
            maxRetries: 100
          }
        })
      })
    };
  }, [evmAccount, signEvmTypedData, testnetModeEnabled]);

  const { data: clients, mutate } = useTypedSWR(
    ['hyperliquid-client', evmAccount?.address, testnetModeEnabled, arbitrum.rpcBaseURL],
    getClients,
    { suspense: true, revalidateOnFocus: false, revalidateOnMount: true }
  );
  const prevClientsRef = useRef<typeof clients>(clients);

  useEffect(() => {
    if (prevClientsRef.current !== clients) {
      prevClientsRef.current?.subscription?.transport.close();
      prevClientsRef.current = clients;
    }
  }, [clients]);

  return { clients: clients!, regenerateClients: mutate };
});
