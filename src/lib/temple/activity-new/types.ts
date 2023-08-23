import {
  ActivityType,
  DelegationActivity,
  InteractionActivity,
  RequiredDestinationActivity,
  TzktTokenTransfer
} from '@temple-wallet/transactions-parser';

import { TzktOperation } from 'lib/apis/tzkt';

export interface OperationsGroup {
  hash: string;
  operations: TzktOperation[];
  tokensTransfers: TzktTokenTransfer[];
}

interface DisplayableRequiredDestinationActivity extends RequiredDestinationActivity {
  type: Exclude<
    RequiredDestinationActivity['type'],
    ActivityType.LiquidityBakingBurn | ActivityType.LiquidityBakingMint
  >;
}

export type DisplayableActivity = DelegationActivity | DisplayableRequiredDestinationActivity | InteractionActivity;
