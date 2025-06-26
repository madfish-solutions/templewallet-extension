import { IntercomClient } from 'lib/intercom/client';
import { TempleRequest, TempleResponse, TempleMessageType } from 'lib/temple/types';

export const intercomClient = new IntercomClient();

export async function makeIntercomRequest(req: TempleRequest) {
  const res = await intercomClient.request(req);
  assertResponse('type' in res);

  return res as TempleResponse;
}

export function assertResponse(condition: any): asserts condition {
  if (!condition) {
    throw new Error('Invalid response recieved');
  }
}

export async function getAccountPublicKey(accountAddress: string) {
  const res = await makeIntercomRequest({
    type: TempleMessageType.RevealPublicKeyRequest,
    accountAddress
  });

  assertResponse(res.type === TempleMessageType.RevealPublicKeyResponse);

  return res.publicKey;
}
