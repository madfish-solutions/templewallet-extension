import type BigNumber from 'bignumber.js';

export interface StakingCyclesInfo {
  blocks_per_cycle: number;
  /** In seconds */
  minimal_block_delay?: BigNumber;
  cooldownCyclesLeft: number;
}
