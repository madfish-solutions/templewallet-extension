import { object as objectSchema, tuple as tupleSchema, number as numberSchema, TupleSchema } from 'yup';

import { evmRpcMethodsNames } from 'temple/evm/constants';
import { ChangePermissionsPayload } from 'temple/evm/types';

import {
  evmAddressValidationSchema,
  hexStringSchema,
  oldTypedDataValidationSchema,
  typedDataValidationSchema
} from './utils';

export const ethOldSignTypedDataValidationSchema = tupleSchema([
  oldTypedDataValidationSchema.clone().required(),
  evmAddressValidationSchema.clone().required()
]).required();

export const ethSignTypedDataValidationSchema = tupleSchema([
  evmAddressValidationSchema.clone().required(),
  typedDataValidationSchema.clone().json().required()
]).required();

export const ethPersonalSignPayloadValidationSchema = tupleSchema([
  hexStringSchema.clone().required(),
  evmAddressValidationSchema.clone().required()
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
