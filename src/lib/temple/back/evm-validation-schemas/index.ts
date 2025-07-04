import {
  mixed as mixedSchema,
  object as objectSchema,
  tuple as tupleSchema,
  number as numberSchema,
  string as stringSchema,
  TupleSchema,
  Schema,
  MixedSchema
} from 'yup';

import { evmRpcMethodsNames } from 'temple/evm/constants';
import { ChangePermissionsPayload } from 'temple/evm/types';

import { rpcTransactionRequestValidationSchema } from './transaction-request';
import {
  evmAddressValidationSchema,
  hexByteStringSchema,
  hexStringSchema,
  oldTypedDataValidationSchema,
  stringArraySchema,
  typedDataValidationSchema
} from './utils';

export const ethOldSignTypedDataValidationSchema = tupleSchema([
  oldTypedDataValidationSchema().required(),
  evmAddressValidationSchema().required()
]).required();

export const ethSignTypedDataValidationSchema = tupleSchema([
  evmAddressValidationSchema().required(),
  typedDataValidationSchema().json().required()
]).required();

type AnyPresentValue = NonNullable<unknown>;
function oneOfSchemas<T1 extends AnyPresentValue, T2 extends AnyPresentValue>(
  schemas: [Schema<T1 | undefined>, Schema<T2 | undefined>]
): MixedSchema<T1 | T2 | undefined> {
  return mixedSchema<T1 | T2>((value: unknown): value is T1 | T2 => {
    for (const schema of schemas) {
      try {
        if (!schema) {
          continue;
        }

        schema.validateSync(value);
        return true;
      } catch {
        // Do nothing
      }
    }

    return false;
  });
}

export const ethPersonalSignPayloadValidationSchema = oneOfSchemas([
  tupleSchema([hexByteStringSchema().required(), evmAddressValidationSchema().required(), stringSchema().nullable()]),
  tupleSchema([hexByteStringSchema().required(), evmAddressValidationSchema().required()])
]).required();

export const addEthAssetPayloadValidationSchema = objectSchema()
  .shape({
    type: stringSchema().required(),
    options: objectSchema()
      .shape({
        address: evmAddressValidationSchema().required()
      })
      .required()
  })
  .required();

interface EthereumChainAddRequest {
  chainId: string;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
  iconUrls?: string[];
}

const ethereumChainAddRequestValidationSchema = () =>
  objectSchema<EthereumChainAddRequest>().shape({
    chainId: stringSchema().required(),
    chainName: stringSchema().required(),
    nativeCurrency: objectSchema()
      .shape({
        name: stringSchema().required(),
        symbol: stringSchema().required(),
        decimals: numberSchema().integer().positive().required()
      })
      .required(),
    rpcUrls: stringArraySchema().required(),
    blockExplorerUrls: stringArraySchema(),
    iconUrls: stringArraySchema()
  });

export const addEthChainPayloadValidationSchema = oneOfSchemas<
  [EthereumChainAddRequest, HexString | nullish],
  [EthereumChainAddRequest]
>([
  tupleSchema([ethereumChainAddRequestValidationSchema().required(), hexStringSchema()]),
  tupleSchema([ethereumChainAddRequestValidationSchema().required()])
]).required();

export const switchEthChainPayloadValidationSchema = tupleSchema([
  objectSchema().shape({
    chainId: numberSchema().integer().positive().required()
  })
]).required();

export const ethChangePermissionsPayloadValidationSchema: TupleSchema<[ChangePermissionsPayload]> = tupleSchema([
  objectSchema()
    .shape({ [evmRpcMethodsNames.eth_accounts]: objectSchema().required() })
    .required()
]).required();

export const personalSignRecoverPayloadValidationSchema = tupleSchema([
  hexByteStringSchema().required(),
  hexByteStringSchema().required()
]).required();

export const sendTransactionPayloadValidationSchema = tupleSchema([
  rpcTransactionRequestValidationSchema().required()
]).required();
