import { getHypeLabIframeMessageType } from './popup-ad';

describe('getHypeLabIframeMessageType', () => {
  it('reads a typed object payload', () => {
    expect(getHypeLabIframeMessageType({ type: 'impression' })).toBe('impression');
  });

  it('parses a JSON string payload', () => {
    expect(getHypeLabIframeMessageType('{"type":"ready"}')).toBe('ready');
  });

  it('ignores unrelated payloads', () => {
    expect(getHypeLabIframeMessageType('not-json')).toBeUndefined();
    expect(getHypeLabIframeMessageType({ kind: 'impression' })).toBeUndefined();
    expect(getHypeLabIframeMessageType(null)).toBeUndefined();
  });
});
