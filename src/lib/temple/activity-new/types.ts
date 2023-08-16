import { ActivityType, DelegationActivity, RequiredDestinationActivity } from '@temple-wallet/transactions-parser';

import { TzktOperation } from 'lib/apis/tzkt';

export interface OperationsGroup {
  hash: string;
  operations: TzktOperation[];
}

interface DisplayableRequiredDestinationActivity extends RequiredDestinationActivity {
  type: Exclude<
    ActivityType,
    ActivityType.LiquidityBakingBurn | ActivityType.LiquidityBakingMint | ActivityType.Delegation
  >;
}

export type DisplayableActivity = DelegationActivity | DisplayableRequiredDestinationActivity;
