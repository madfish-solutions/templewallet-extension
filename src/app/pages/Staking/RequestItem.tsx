import React, { CSSProperties, FC, memo, PropsWithChildren, useMemo } from 'react';

import { LevelInfo } from '@taquito/rpc';
import BigNumber from 'bignumber.js';

import { Money } from 'app/atoms';
import { StakingCyclesInfo } from 'app/hooks/use-baking-hooks';
import { OpenInExplorerChipBase } from 'app/templates/OpenInExplorerChip';
import { BLOCK_DURATION } from 'lib/fixed-times';
import { TEZOS_METADATA } from 'lib/metadata';
import { atomsToTokens } from 'lib/temple/helpers';

export const AMOUNT_COLUMN_STYLE: CSSProperties = { flex: 1.32 };

export interface UnstakeRequest {
  ready?: boolean;
  amount: BigNumber;
  cycle: number;
}

interface Props extends UnstakeRequest {
  cyclesInfo: StakingCyclesInfo | nullish;
  blockLevelInfo: LevelInfo | nullish;
  cyclesUrl?: string;
}

export const RequestItem = memo<Props>(({ ready, amount, cycle, cyclesInfo, blockLevelInfo, cyclesUrl }) => {
  const endCycle = useMemo(() => {
    if (!cyclesInfo) return;

    return cycle + cyclesInfo.cooldownCyclesNumber - /* Accounting for current cycle*/ 1;
  }, [cycle, cyclesInfo]);

  if (ready)
    return (
      <RequestItemBase amount={amount} endCycle={endCycle} cyclesUrl={cyclesUrl}>
        <span className="text-green-500">Ready</span>
      </RequestItemBase>
    );

  return (
    <UnfinalizableRequestItem
      amount={amount}
      cyclesInfo={cyclesInfo}
      blockLevelInfo={blockLevelInfo}
      endCycle={endCycle}
      cyclesUrl={cyclesUrl}
    />
  );
});

interface UnfinalizableRequestItemProps extends RequestItemBaseProps {
  cyclesInfo: StakingCyclesInfo | nullish;
  blockLevelInfo: LevelInfo | nullish;
}

const UnfinalizableRequestItem = memo<UnfinalizableRequestItemProps>(
  ({ amount, cyclesInfo, blockLevelInfo, endCycle, cyclesUrl }) => {
    const cooldownTime = useMemo(() => {
      if (!cyclesInfo || !blockLevelInfo || endCycle == null) return;

      const { blocks_per_cycle, minimal_block_delay } = cyclesInfo;

      const fullCyclesLeft = endCycle - blockLevelInfo.cycle;
      const blocksLeftInCurrentCycle = blocks_per_cycle - blockLevelInfo.cycle_position;

      const blocksLeft = blocks_per_cycle * fullCyclesLeft + blocksLeftInCurrentCycle;

      const blockDuration = minimal_block_delay?.toNumber() ?? BLOCK_DURATION / 1000;
      const secondsLeft = blocksLeft * blockDuration;

      return Math.round(secondsLeft / 3600);
    }, [cyclesInfo, blockLevelInfo, endCycle]);

    const cooldownTimeStr = cooldownTime == null ? '---' : `≈${cooldownTime}h`;

    return (
      <RequestItemBase amount={amount} endCycle={endCycle} cyclesUrl={cyclesUrl}>
        {cooldownTimeStr}
      </RequestItemBase>
    );
  }
);

interface RequestItemBaseProps {
  amount: BigNumber;
  endCycle?: number;
  cyclesUrl?: string;
}

const RequestItemBase: FC<PropsWithChildren<RequestItemBaseProps>> = ({ amount, endCycle, cyclesUrl, children }) => {
  return (
    <div className="flex text-sm font-medium text-blue-750">
      <div style={AMOUNT_COLUMN_STYLE}>
        <Money smallFractionFont={false} cryptoDecimals={TEZOS_METADATA.decimals}>
          {atomsToTokens(amount, TEZOS_METADATA.decimals)}
        </Money>{' '}
        {TEZOS_METADATA.symbol}
      </div>

      <div className="flex-1">{children}</div>

      <div className="flex-1 flex items-center justify-end gap-x-1">
        {endCycle == null ? '---' : endCycle}
        {cyclesUrl ? <OpenInExplorerChipBase className="ml-px" href={cyclesUrl} small alternativeDesign /> : null}
      </div>
    </div>
  );
};
