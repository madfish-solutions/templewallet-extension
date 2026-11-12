import BigNumber from 'bignumber.js';
import { pick } from 'lodash';

import { TempleTzktOperationsGroup, TezosPreActivityOperation } from 'lib/activity/tezos/types';
import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { toTezosAssetSlug } from 'lib/assets/utils';
import { isTezosContractAddress } from 'lib/tezos';
import { TempleChainKind } from 'temple/types';

import {
  TezosActivity,
  ActivityOperKindEnum,
  TezosOperation,
  ActivityStatus,
  ActivityOperTransferType
} from '../types';
import { isBridgeOperation, isShieldedTezosOperation } from '../utils';

import { preparseTezosOperationsGroup, SAPLING_CONTRACT_ADDRESS } from './pre-parse';

export function parseTezosOperationsGroup(
  operationsGroup: TempleTzktOperationsGroup,
  chainId: string,
  address: string
): TezosActivity {
  const preActivity = preparseTezosOperationsGroup(operationsGroup, address, chainId);

  const { hash, addedAt, operations: preOperations, oldestTzktOperation, status } = preActivity;

  const operations = withoutBridgeInternalCalls(
    withoutUnshieldingCall(preOperations.map(oper => parseTezosPreActivityOperation(oper, address)))
  );

  return {
    hash,
    chain: TempleChainKind.Tezos,
    chainId,
    operations,
    operationsCount: operations.length,
    addedAt,
    oldestTzktOperation: pick(oldestTzktOperation, ['timestamp', 'level', 'id', 'hash']),
    status:
      status === 'applied'
        ? ActivityStatus.applied
        : status === 'pending'
          ? ActivityStatus.pending
          : ActivityStatus.failed
  };
}

const isShieldedInteraction = (operation: TezosOperation) =>
  operation.kind === ActivityOperKindEnum.interaction && isShieldedTezosOperation(operation);

const isShieldedPayout = (operation: TezosOperation) =>
  operation.kind === ActivityOperKindEnum.transfer &&
  isShieldedTezosOperation(operation) &&
  operation.toAddress !== SAPLING_CONTRACT_ADDRESS;

const withoutUnshieldingCall = (operations: TezosOperation[]) =>
  operations.filter(isShieldedInteraction).length === 1 && operations.some(isShieldedPayout)
    ? operations.filter(operation => !isShieldedInteraction(operation))
    : operations;

const ETHERLINK_BRIDGE_HELPER_ADDRESS = 'KT1Wj8SUGmnEPFqyahHAcjcNQwe6YGhEXJb5';
const ETHERLINK_BRIDGE_EXCHANGER_ADDRESS = 'KT1CeFqjJRJPNVvhvznQrWfHad2jCiDZ6Lyj';
const ETHERLINK_ROLLUP_ADDRESS = 'sr1Ghq66tYK9y3r8CC1Tf8i8m5nxh8nTvZEf';
const ETHERLINK_FAST_WITHDRAWAL_CONTRACT_ADDRESS = 'KT1BGwyCrnJ6HuEYP7X8Q2UooTdxmEYHiK6j';
const ETHERLINK_BRIDGE_CONTRACTS = new Set([
  ETHERLINK_BRIDGE_HELPER_ADDRESS,
  ETHERLINK_BRIDGE_EXCHANGER_ADDRESS,
  ETHERLINK_ROLLUP_ADDRESS,
  ETHERLINK_FAST_WITHDRAWAL_CONTRACT_ADDRESS
]);

const isBridgeContractInteraction = (operation: TezosOperation) =>
  operation.kind === ActivityOperKindEnum.interaction &&
  operation.withAddress !== undefined &&
  ETHERLINK_BRIDGE_CONTRACTS.has(operation.withAddress);

const withoutBridgeInternalCalls = (operations: TezosOperation[]) =>
  operations.some(isBridgeOperation)
    ? operations.filter(operation => !isBridgeContractInteraction(operation))
    : operations;

function parseTezosPreActivityOperation(preOperation: TezosPreActivityOperation, address: string): TezosOperation {
  if (preOperation.type !== 'transaction') {
    return { kind: ActivityOperKindEnum.interaction, withAddress: preOperation.destination?.address };
  }

  const withAddress = preOperation.destination.address;
  const isShielded =
    withAddress === SAPLING_CONTRACT_ADDRESS || preOperation.sender.address === SAPLING_CONTRACT_ADDRESS;

  if (withAddress === SAPLING_CONTRACT_ADDRESS && new BigNumber(preOperation.amountSigned).isZero()) {
    return { kind: ActivityOperKindEnum.interaction, withAddress, isShielded: true };
  }

  const firstTo = preOperation.to.at(0);

  if (!firstTo) return { kind: ActivityOperKindEnum.interaction, withAddress };

  const assetSlug = toTezosAssetSlug(preOperation.contract ?? TEZ_TOKEN_SLUG, preOperation.tokenId);
  const { amountSigned } = preOperation;

  if (preOperation.subtype === 'approve') {
    return {
      kind: ActivityOperKindEnum.approve,
      spenderAddress: firstTo.address,
      assetSlug,
      amountSigned: preOperation.entrypoint === 'update_operators' ? null : amountSigned
    };
  }

  const fromAddress = preOperation.from.address;
  const toAddress = firstTo.address;

  if (fromAddress === address) {
    const isBridge = assetSlug === TEZ_TOKEN_SLUG && toAddress === ETHERLINK_BRIDGE_HELPER_ADDRESS;

    return {
      kind: ActivityOperKindEnum.transfer,
      type:
        isShielded || isBridge || (preOperation.to.length === 1 && !isTezosContractAddress(toAddress))
          ? ActivityOperTransferType.sendToAccount
          : ActivityOperTransferType.send,
      fromAddress,
      toAddress,
      assetSlug,
      amountSigned,
      isShielded: isShielded || undefined,
      isBridge: isBridge || undefined
    };
  }

  if (preOperation.to.some(member => member.address === address)) {
    const isBridge = assetSlug === TEZ_TOKEN_SLUG && ETHERLINK_BRIDGE_CONTRACTS.has(fromAddress);

    return {
      kind: ActivityOperKindEnum.transfer,
      type:
        isShielded || isBridge || !isTezosContractAddress(fromAddress)
          ? ActivityOperTransferType.receiveFromAccount
          : ActivityOperTransferType.receive,
      fromAddress,
      toAddress,
      assetSlug,
      amountSigned,
      isShielded: isShielded || undefined,
      isBridge: isBridge || undefined
    };
  }

  return { kind: ActivityOperKindEnum.interaction, withAddress };
}
