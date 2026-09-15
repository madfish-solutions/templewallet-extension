import { CID } from 'multiformats/cid';

import { getIpfsItemInfo, parseMediaUri } from './ipfs';

const CID_V0 = 'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG';
const CID_V1 = 'bafybeie5nqv6kd3qnfjupgvz34woh3oksc3iau6abmyajn7qvtf6d2ho34';

describe('multiformats/cid', () => {
  it('should resolve the module and parse CIDs', () => {
    expect(CID.parse(CID_V0).toV1().toString()).toEqual(CID_V1);
  });
});

describe('getIpfsItemInfo', () => {
  it('should parse an ipfs URI and convert the id to CIDv1', () => {
    expect(getIpfsItemInfo(`ipfs://${CID_V0}/foo?bar=1`)).toEqual({
      id: CID_V0,
      idV1: CID_V1,
      pathWithoutCid: 'foo',
      search: '?bar=1'
    });
  });

  it('should return null for an invalid CID', () => {
    expect(getIpfsItemInfo('ipfs://not-a-cid')).toBeNull();
  });
});

describe('parseMediaUri', () => {
  it('should recover IPFS info from a path-style HTTP gateway URL', () => {
    const { ipfsAware } = parseMediaUri(`https://ipfs.io/ipfs/${CID_V0}/foo`);

    expect(ipfsAware.ipfs).toEqual({
      id: CID_V0,
      idV1: CID_V1,
      pathWithoutCid: 'foo',
      search: ''
    });
  });
});
