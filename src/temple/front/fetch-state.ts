import { TempleMessageType } from 'lib/temple/types';

import { assertResponse, makeIntercomRequest } from './intercom-client';

export const fetchState = async () => {
  const res = await makeIntercomRequest({ type: TempleMessageType.GetStateRequest });
  assertResponse(res.type === TempleMessageType.GetStateResponse);
  return res.state;
};
