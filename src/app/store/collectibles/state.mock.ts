import { createEntity } from 'lib/store';

import { CollectiblesState } from './state';

export const mockCollectiblesState: CollectiblesState = {
  details: createEntity({})
};
