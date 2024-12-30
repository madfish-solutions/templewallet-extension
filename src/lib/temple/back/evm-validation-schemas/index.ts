import {
  mixed as mixedSchema,
  object as objectSchema,
  tuple as tupleSchema,
  number as numberSchema,
  string as stringSchema,
  TupleSchema
} from 'yup';

import { evmRpcMethodsNames } from 'temple/evm/constants';
import { ChangePermissionsPayload } from 'temple/evm/types';

import {
  evmAddressValidationSchema,
  hexStringSchema,
  oldTypedDataValidationSchema,
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

export const ethPersonalSignPayloadValidationSchema = mixedSchema<
  [HexString, HexString, string] | [HexString, HexString]
>((value: unknown): value is [HexString, HexString, string] | [HexString, HexString] => {
  const tuplesSchemas = [
    tupleSchema([hexStringSchema().required(), evmAddressValidationSchema().required(), stringSchema().required()]),
    tupleSchema([hexStringSchema().required(), evmAddressValidationSchema().required()])
  ];

  for (const schema of tuplesSchemas) {
    try {
      schema.validateSync(value);

      return true;
    } catch {
      // Do nothing
    }
  }

  return false;
}).required();

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
  hexStringSchema().required(),
  hexStringSchema().required()
]).required();
