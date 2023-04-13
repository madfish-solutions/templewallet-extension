import { ABTestGroup } from 'lib/apis/temple';

export interface ABTestingState {
  groupName: ABTestGroup;
}

export const abTestingInitialState: ABTestingState = {
  groupName: ABTestGroup.Unknown
};
