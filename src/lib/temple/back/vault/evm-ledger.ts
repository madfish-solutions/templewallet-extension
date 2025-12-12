import type Eth from '@ledgerhq/hw-app-eth';
import type { LedgerEthTransactionResolution } from '@ledgerhq/hw-app-eth/lib/services/types';
import type { EIP712Message } from '@ledgerhq/types-live/src/messages/evm';
import { getAddress, serializeSignature, serializeTransaction } from 'viem';
import { toAccount } from 'viem/accounts';

import { isLedgerRejectionError } from 'lib/utils/ledger';

import { hashStruct } from './hash-struct';
import { serializeLedgerTransaction, toViemSignature } from './serialize-ledger-transaction';

const withSerializeLedgerSignature =
  <A extends unknown[]>(
    fn: (...args: A) => Promise<{
      v: number | string;
      s: string;
      r: string;
    }>
  ) =>
  (...args: A) =>
    fn(...args).then(ledgerSig => serializeSignature(toViemSignature(ledgerSig)));

export const makeEvmAccount = async (ethApp: Eth, derivationPath: string) => {
  const { address } = await ethApp.getAddress(derivationPath);

  return toAccount({
    address: getAddress(address),
    // TODO: add `sign`
    signMessage: withSerializeLedgerSignature(({ message: wrappedMessage }) => {
      let messageHex: string;
      if (typeof wrappedMessage === 'string') {
        messageHex = Buffer.from(wrappedMessage).toString('hex');
      } else if (typeof wrappedMessage.raw === 'string') {
        messageHex = wrappedMessage.raw.startsWith('0x') ? wrappedMessage.raw.slice(2) : wrappedMessage.raw;
      } else {
        messageHex = Buffer.from(wrappedMessage.raw).toString('hex');
      }

      return ethApp.signPersonalMessage(derivationPath, messageHex);
    }),
    signTransaction: async (transaction, { serializer = serializeTransaction } = {}) => {
      const rawTx = serializer(transaction);
      const { ledgerService } = await import('@ledgerhq/hw-app-eth');
      let resolution: LedgerEthTransactionResolution | undefined;
      try {
        resolution = await ledgerService.resolveTransaction(rawTx.slice(2), {}, {});
      } catch (e) {
        console.error(e);
      }

      return serializeLedgerTransaction(
        transaction,
        await ethApp.signTransaction(derivationPath, rawTx.slice(2), resolution)
      );
    },
    signTypedData: withSerializeLedgerSignature(async parameters => {
      try {
        return await ethApp.signEIP712Message(derivationPath, parameters as unknown as EIP712Message);
      } catch (e: any) {
        if (isLedgerRejectionError(e)) {
          throw e;
        }

        const domainSeparatorHex = hashStruct({
          primaryType: 'EIP712Domain',
          data: parameters.domain!,
          // @ts-expect-error
          types: parameters.types
        });
        const hashStructMessageHex = hashStruct({
          primaryType: parameters.primaryType,
          data: parameters.message!,
          // @ts-expect-error
          types: parameters.types
        });

        return await ethApp.signEIP712HashedMessage(derivationPath, domainSeparatorHex, hashStructMessageHex);
      }
    })
  });
};
