import React, { memo, PropsWithChildren, useMemo } from 'react';

import { LevelInfo } from '@taquito/rpc';
import BigNumber from 'bignumber.js';

import { Money } from 'app/atoms';
import { BLOCK_DURATION } from 'lib/fixed-times';
import { TEZOS_METADATA } from 'lib/metadata';
import { atomsToTokens } from 'lib/temple/helpers';

import { StakingCyclesInfo } from './types';

export const FinalizableRequestItem = memo<RequestItemProps>(({ amount }) => (
  <RequestItem amount={amount}>
    <span className="text-green-500">Ready</span>
  </RequestItem>
));

interface UnfinalizableRequestItemProps extends RequestItemProps {
  cycle: number;
  cyclesInfo: StakingCyclesInfo | nullish;
  level_info: LevelInfo | nullish;
}

export const UnfinalizableRequestItem = memo<UnfinalizableRequestItemProps>(
  ({ amount, cycle, cyclesInfo, level_info }) => {
    const cooldownTime = useMemo(() => {
      if (!cyclesInfo || !level_info) return 0;

      const { blocks_per_cycle, minimal_block_delay, cooldownCyclesLeft } = cyclesInfo;

      const fullCyclesLeft = cycle + cooldownCyclesLeft - level_info.cycle;
      const blocksLeftInCurrentCycle = blocks_per_cycle - level_info.cycle_position;

      const blocksLeft = blocks_per_cycle * fullCyclesLeft + blocksLeftInCurrentCycle;

      const blockDuration = minimal_block_delay?.toNumber() ?? BLOCK_DURATION / 1000;
      const secondsLeft = blocksLeft * blockDuration;

      return Math.floor(secondsLeft / 3600);
    }, [cycle, cyclesInfo, level_info]);

    return (
      <RequestItem amount={amount}>
        <span>{cooldownTime > 0 ? `${cooldownTime}s` : '---'}</span>
      </RequestItem>
    );
  }
);

interface RequestItemProps {
  amount: BigNumber;
}

const RequestItem = memo<PropsWithChildren<RequestItemProps>>(({ amount, children }) => {
  return (
    <div className="flex text-sm font-medium text-blue-750">
      <span>
        <Money smallFractionFont={false} cryptoDecimals={TEZOS_METADATA.decimals}>
          {atomsToTokens(amount, TEZOS_METADATA.decimals)}
        </Money>{' '}
        {TEZOS_METADATA.symbol}
      </span>

      <div className="flex-1" />

      {children}
    </div>
  );
});
