import { b58DecodeAndCheckPrefix, hex2buf } from '@tezos-x/octez.js-utils';
import { crypto_generichash, ready } from 'libsodium-wrappers';
import toBuffer from 'typedarray-to-buffer';

import { toLedgerError } from './helpers';
import { curves, getSig, prefNames, safeSignEdData, safeSignP2Data, safeSignSpData, verifySignature } from './signer';

const PAYLOAD =
  '0501313230363136653739323037333734373236393665363732303734363836313734323037373639366336633230363236353230373336393637366536353634';

const WRONG_PAYLOAD =
  '0501313230363136653739323037333734373236393665363732303734363836313734523037373639366336633230363236353230373336393637366536353634';
// Two 'ed' signatures, keys and so on are got with ED25519 and BIP32_ED25519 derivations types respectively
const SIGNATURES = {
  ed: [
    'edsigtyb1zfVFHCxy458ZqZ1s4CGJdhrV6ocgj3JxpMj3qX6vHEaYKnifTPFNirwxznPW3xBrTWWrDdu2qDoJqCPNQi3DVMc8dS',
    'edsigti89JpVguBwhnnCovedADJqfiXDwhW5HqjiFViuFu2TULprEz2ymFund4pLoueYKBvFFHGBGb9VrA89rJSZexojeHzXS6u'
  ],
  sp: ['spsig1UoxGshstbBBbdsWEKMQXDnZeSQUgYmWkSup2L2NoGWYfWH6it3V8Fpds1obbHPwe133WdGUez6VwDAU6429xjsn21Zr84'],
  p2: ['p2sigsHG1Wprp1N8npqXFHEjkNgh9NUBMsr6xUzy8dyAD3cmwn6PUo4LsFAs97otv3Vqm2C5DyNduaydvS91zB3NzynV1rACUb']
};

const PUBLIC_KEYS = {
  ed: [
    'edpkvBYQLaemWxY8k6R5nYmdWhUQmBNgMW81mo9kMovfeWpD71kTSL',
    'edpkucYHAQjz4NixHXxvSRhrrwrQinjxUqMPfzjVvgKy4SZo7utPiV'
  ],
  sp: ['sppk7c2AdKViHtcjmfY7cYuGn8iMTa5U91wx4brSJw9FadzPzo5BB3A'],
  p2: ['p2pk67DMkN5mgnXxt9ShrDmuiS6b3hSyhfMN8SkHDbM95zcaGcn7GAN']
};

const PUBLIC_KEY_HASHES = {
  ed: ['tz1gohAk1nxzdKTt76iXeynpZESwTEMnjRq8', 'tz1eHobSuftCie5ykch7Bc5eNxscxKeq1PpF'],
  sp: ['tz2WanjrRiuHat2ZaQrbsq13rm4E5qmqnBwA'],
  p2: ['tz3RMrbWr9g3tb4oM48LUF91EGK4mrBMS5ja']
};

describe('Ledger Signer tests', () => {
  beforeEach(async () => {
    await ready;
  });
  describe('verifySignature', () => {
    const assertSignatureRecognized = (curveCode: curves, accountIndex: number) => {
      const publicKey = PUBLIC_KEYS[curveCode][accountIndex];
      const signature = SIGNATURES[curveCode][accountIndex];
      const publicKeyHash = PUBLIC_KEY_HASHES[curveCode][accountIndex];
      const res = verifySignature(PAYLOAD, signature, publicKey, publicKeyHash);
      expect(res).toBe(true);
    };

    it('Verify edsig message work', async () => assertSignatureRecognized('ed', 0));
    it('Verify edsig message work, BIP32 derivation method', async () => assertSignatureRecognized('ed', 1));
    it('Verify spsig message work', async () => assertSignatureRecognized('sp', 0));
    it('Verify p256sig message work', async () => assertSignatureRecognized('p2', 0));
    it('Wrong public key to verify message', async () => {
      expect(() => verifySignature(PAYLOAD, SIGNATURES.ed[0], PUBLIC_KEYS.sp[0], PUBLIC_KEY_HASHES.ed[0])).toThrow();
    });
    it('Unsupported curve to verify message', async () => {
      expect(() =>
        verifySignature(PAYLOAD, SIGNATURES.ed[0], 'do' + PUBLIC_KEYS.ed[0].substring(2), PUBLIC_KEY_HASHES.ed[0])
      ).toThrow();
    });
    it('Unsupported signature given by remote signer to verify message', async () => {
      expect(() =>
        verifySignature(PAYLOAD, 'wrong' + SIGNATURES.ed[0], PUBLIC_KEYS.ed[0], PUBLIC_KEY_HASHES.ed[0])
      ).toThrow();
    });
  });

  const assertSafeSignResult = (
    fn: (sig: Uint8Array, bytesHash: Uint8Array, _publicKey: any) => boolean,
    curveName: curves,
    accountIndex: number,
    payload: string,
    expectedResult: boolean
  ) => {
    const _publicKey = new Uint8Array(
      toBuffer(b58DecodeAndCheckPrefix(PUBLIC_KEYS[curveName][accountIndex], [prefNames[curveName].pk], true))
    );
    const sig = new Uint8Array(getSig(SIGNATURES[curveName][accountIndex], curveName, prefNames));
    const bytesHash = crypto_generichash(32, hex2buf(payload));
    const data = fn(sig, bytesHash, _publicKey);
    expect(data).toBe(expectedResult);
  };

  describe('safeSignEdData', () => {
    it('Verify correct message with ed curve', async () =>
      assertSafeSignResult(safeSignEdData, 'ed', 0, PAYLOAD, true));
    it('Verify incorrect message with ed curve', async () =>
      assertSafeSignResult(safeSignEdData, 'ed', 0, WRONG_PAYLOAD, false));
    it('Verify correct message with ed curve, BIP32 derivation', async () =>
      assertSafeSignResult(safeSignEdData, 'ed', 1, PAYLOAD, true));
    it('Verify incorrect message with ed curve, BIP32 derivation', async () =>
      assertSafeSignResult(safeSignEdData, 'ed', 1, WRONG_PAYLOAD, false));
  });
  describe('safeSignSpData', () => {
    it('Verify correct message with secp256k1 curve', async () =>
      assertSafeSignResult(safeSignSpData, 'sp', 0, PAYLOAD, true));
    it('Verify incorrect message with secp256k1 curve', async () =>
      assertSafeSignResult(safeSignSpData, 'sp', 0, WRONG_PAYLOAD, false));
  });
  describe('safeSignP2Data', () => {
    it('Verify correct message with p256 curve', async () => {
      await ready;
      assertSafeSignResult(safeSignP2Data, 'p2', 0, PAYLOAD, true);
    });
    it('Verify incorrect message with p256 curve', async () => {
      await ready;
      assertSafeSignResult(safeSignP2Data, 'p2', 0, WRONG_PAYLOAD, false);
    });
  });
  describe('getSig', () => {
    it('Get signature prefix', async () => {
      expect(() => getSig('sig123', null, null)).toThrow();
    });
    it('Get curve prefix', async () => {
      const curve = PUBLIC_KEYS.p2[0].substring(0, 2) as curves;
      const sig = getSig(SIGNATURES.p2[0], curve, prefNames);
      expect(sig.byteLength).toBe(64);
    });
    it('Throw error on invalid curve', async () => {
      expect(() => getSig('notsig123', null, null)).toThrowError(`Invalid signature provided: notsig123`);
    });
  });
  describe('toLedgerError', () => {
    it('it spawns new error', async () => {
      const errMessage = 'some mock error';
      const err = toLedgerError(new Error(errMessage));
      expect(err).toHaveProperty('message');
      expect(err.message).toBe(`Ledger error. ${errMessage}`);
    });
  });
});
