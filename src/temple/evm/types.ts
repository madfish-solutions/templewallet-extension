import {
  AccessList,
  BlobSidecar,
  ExactPartial,
  FeeValuesEIP1559,
  FeeValuesEIP4844,
  FeeValuesLegacy,
  OneOf,
  PrivateKeyAccount,
  RequiredBy,
  SendTransactionParameters,
  SendTransactionRequest,
  TransactionRequestBase
} from 'viem';
import { Signature } from 'viem/_types/types/misc';

import { EvmNativeTokenMetadata } from 'lib/metadata/types';

interface RestoredChain {
  id: number;
  name: string;
  nativeCurrency: EvmNativeTokenMetadata;
  rpcUrls: {
    default: {
      http: string[];
    };
  };
}

export type EvmTxParams = SendTransactionParameters<
  RestoredChain,
  PrivateKeyAccount,
  undefined,
  SendTransactionRequest<RestoredChain, undefined>
>;

export type WithSerializedBigint<T extends Partial<StringRecord<unknown>>> = {
  [K in keyof T]: Replace<T[K], bigint, string>;
};

type SerializableFeeValuesLegacy = WithSerializedBigint<FeeValuesLegacy>;

type SerializableFeeValuesEIP1559 = WithSerializedBigint<FeeValuesEIP1559>;

type SerializableFeeValuesEIP4844 = WithSerializedBigint<FeeValuesEIP4844>;

type SerializableEvmTxParamsBase<T extends string> = WithSerializedBigint<TransactionRequestBase<bigint, number, T>>;

type SerializableEvmTxParamsLegacy = SerializableEvmTxParamsBase<'legacy'> & ExactPartial<SerializableFeeValuesLegacy>;

type SerializableEvmTxParamsEIP2930 = SerializableEvmTxParamsBase<'eip2930'> &
  ExactPartial<SerializableFeeValuesLegacy> & {
    accessList?: AccessList | undefined;
  };

type SerializableEvmTxParamsEIP1559 = SerializableEvmTxParamsBase<'eip1559'> &
  ExactPartial<SerializableFeeValuesEIP1559> & {
    accessList?: AccessList | undefined;
  };

type SerializableEvmTxParamsEIP4844 = RequiredBy<SerializableEvmTxParamsBase<'eip4844'>, 'to'> &
  RequiredBy<ExactPartial<SerializableFeeValuesEIP4844>, 'maxFeePerBlobGas'> & {
    accessList?: AccessList | undefined;
    blobs: readonly HexString[];
    blobVersionedHashes?: readonly HexString[] | undefined;
    // TODO: Add Kzg initialization params
    sidecars?: readonly BlobSidecar<HexString>[];
  };

type SerializableSignature = WithSerializedBigint<Signature>;

type SerializableAuthorization = {
  contractAddress: HexString;
  chainId: number;
  nonce: number;
} & ExactPartial<SerializableSignature>;

type SerializableEvmTxParamsEIP7702 = SerializableEvmTxParamsBase<'eip7702'> &
  ExactPartial<SerializableFeeValuesEIP1559> & {
    accessList?: AccessList | undefined;
    authorizationList?: SerializableAuthorization[] | undefined;
  };

export type SerializableEvmTxParams = OneOf<
  | SerializableEvmTxParamsLegacy
  | SerializableEvmTxParamsEIP2930
  | SerializableEvmTxParamsEIP1559
  | SerializableEvmTxParamsEIP4844
  | SerializableEvmTxParamsEIP7702
>;
