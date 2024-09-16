import { Activity as LegacyActivity, ActivityOperation as LegacyActivityOperation } from 'lib/temple/activity-new';
import { OperStackItemTypeEnum } from 'lib/temple/activity-new/types';
import { TempleChainKind } from 'temple/types';

import { TezosActivity, ActivityKindEnum, TezosOperation } from './types';

export function formatLegacyTezosActivity(_activity: LegacyActivity, chainId: string, address: string): TezosActivity {
  const hash = _activity.hash;

  return {
    hash,
    chain: TempleChainKind.Tezos,
    chainId,
    operations: _activity.operations.map<TezosOperation>(oper => formatLegacyTezosOperation(oper, address))
  };
}

export function formatLegacyTezosOperation(oper: LegacyActivityOperation, address: string): TezosOperation {
  if (oper.type === 'transaction') {
    if (isZero(oper.amountSigned)) {
      return {
        kind: ActivityKindEnum.interaction,
        subkind: OperStackItemTypeEnum.Interaction
        // with: oper.destination.address,
        // entrypoint: oper.entrypoint
      };
    } else if (oper.source.address === address) {
      return {
        kind: ActivityKindEnum.send,
        subkind: OperStackItemTypeEnum.TransferTo
        // to: oper.destination.address
      };
    } else if (oper.destination.address === address) {
      return {
        kind: ActivityKindEnum.receive,
        subkind: OperStackItemTypeEnum.TransferFrom
        // from: oper.source.address
      };
    }

    return {
      kind: ActivityKindEnum.interaction,
      subkind: OperStackItemTypeEnum.Interaction
    };
  } else if (oper.type === 'delegation' && oper.source.address === address && oper.destination) {
    return {
      kind: ActivityKindEnum.interaction,
      subkind: OperStackItemTypeEnum.Delegation
      // to: oper.destination.address
    };
  }

  return {
    kind: ActivityKindEnum.interaction,
    subkind: OperStackItemTypeEnum.Other
  };
}

const isZero = (val: string) => Number(val) === 0;
