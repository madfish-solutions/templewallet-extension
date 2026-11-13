import { createSignPayloadResponse, decodeMessage, encodeMessage, MessageType, SigningType } from './beacon';

describe('Beacon signing response metadata', () => {
  const envelope = { version: '2', id: 'sign-request', senderId: 'temple' };
  const signature = 'edsig-test-signature';
  const payload = '050100000003616263';

  it.each([SigningType.RAW, SigningType.MICHELINE, SigningType.OPERATION])(
    'returns the explicit %s mode through the real response codec',
    signingType => {
      const request: Parameters<typeof createSignPayloadResponse>[0] = {
        ...envelope,
        type: MessageType.SignPayloadRequest,
        sourceAddress: 'tz1-test-account',
        payload,
        signingType
      };
      const response = decodeMessage(encodeMessage(createSignPayloadResponse(request, signature, envelope)));
      expect(response).toEqual({ ...envelope, type: MessageType.SignPayloadResponse, signature, signingType });
      expect(request.payload).toBe(payload);
    }
  );

  it('preserves the omitted-mode legacy response without inventing a mode or changing the request', () => {
    const request: Parameters<typeof createSignPayloadResponse>[0] = {
      ...envelope,
      type: MessageType.SignPayloadRequest,
      sourceAddress: 'tz1-test-account',
      payload
    };
    const response = decodeMessage(encodeMessage(createSignPayloadResponse(request, signature, envelope)));
    expect(response).toEqual({ ...envelope, type: MessageType.SignPayloadResponse, signature });
    expect(request.payload).toBe(payload);
  });
});
