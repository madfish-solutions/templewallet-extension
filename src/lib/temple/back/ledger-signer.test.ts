import { b58cdecode, hex2buf } from '@taquito/utils';
import { crypto_generichash, ready } from 'libsodium-wrappers';

import toBuffer from 'typedarray-to-buffer';

import {
  curves,
  getSig,
  pref,
  safeSignEdData,
  safeSignP2Data,
  safeSignSpData,
  toLedgerError,
  verifySignature
} from './ledger-signer';

const PAYLOAD = {
  ed: '0501313230363136653739323037333734373236393665363732303734363836313734323037373639366336633230363236353230373336393637366536353634',
  sp: '0501313230363136653739323037333734373236393665363732303734363836313734323037373639366336633230363236353230373336393637366536353634',
  p2: '0501313230363136653739323037333734373236393665363732303734363836313734323037373639366336633230363236353230373336393637366536353634'
};

const WRONG_PAYLOAD =
  '0501313230363136653739323037333734373236393665363732303734363836313734523037373639366336633230363236353230373336393637366536353634';
const SIGNATURE = {
  ed: 'edsigtyb1zfVFHCxy458ZqZ1s4CGJdhrV6ocgj3JxpMj3qX6vHEaYKnifTPFNirwxznPW3xBrTWWrDdu2qDoJqCPNQi3DVMc8dS',
  sp: 'spsig1UoxGshstbBBbdsWEKMQXDnZeSQUgYmWkSup2L2NoGWYfWH6it3V8Fpds1obbHPwe133WdGUez6VwDAU6429xjsn21Zr84',
  p2: 'p2sigsHG1Wprp1N8npqXFHEjkNgh9NUBMsr6xUzy8dyAD3cmwn6PUo4LsFAs97otv3Vqm2C5DyNduaydvS91zB3NzynV1rACUb'
};

const PUBLIC_KEY = {
  ed: 'edpkvBYQLaemWxY8k6R5nYmdWhUQmBNgMW81mo9kMovfeWpD71kTSL',
  sp: 'sppk7c2AdKViHtcjmfY7cYuGn8iMTa5U91wx4brSJw9FadzPzo5BB3A',
  p2: 'p2pk67DMkN5mgnXxt9ShrDmuiS6b3hSyhfMN8SkHDbM95zcaGcn7GAN'
};

const PUBLIC_KEY_HASH = {
  ed: 'tz1gohAk1nxzdKTt76iXeynpZESwTEMnjRq8',
  sp: 'tz2WanjrRiuHat2ZaQrbsq13rm4E5qmqnBwA',
  p2: 'tz3RMrbWr9g3tb4oM48LUF91EGK4mrBMS5ja'
};

describe('Ledger Signer tests', () => {
  beforeEach(async () => {
    await ready;
  });
  describe('verifySignature', () => {
    it('Verify edsig message work', async () => {
      const res = verifySignature(PAYLOAD.ed, SIGNATURE.ed, PUBLIC_KEY.ed, PUBLIC_KEY_HASH.ed);
      expect(res).toBe(true);
    });
    it('Verify spsig message work', async () => {
      const res = verifySignature(PAYLOAD.sp, SIGNATURE.sp, PUBLIC_KEY.sp, PUBLIC_KEY_HASH.sp);
      expect(res).toBe(true);
    });
    it('Verify p256sig message work', async () => {
      const res = verifySignature(PAYLOAD.p2, SIGNATURE.p2, PUBLIC_KEY.p2, PUBLIC_KEY_HASH.p2);
      expect(res).toBe(true);
    });
    it('Wrong public key to verify message', async () => {
      expect(() => verifySignature(PAYLOAD.ed, SIGNATURE.ed, PUBLIC_KEY.sp, PUBLIC_KEY_HASH.ed)).toThrow();
    });
    it('Unsupported curve to verify message', async () => {
      expect(() =>
        verifySignature(PAYLOAD.ed, SIGNATURE.ed, 'do' + PUBLIC_KEY.ed.substring(2), PUBLIC_KEY_HASH.ed)
      ).toThrow();
    });
    it('Unsupported signature given by remote signer to verify message', async () => {
      expect(() => verifySignature(PAYLOAD.ed, 'wrong' + SIGNATURE.ed, PUBLIC_KEY.ed, PUBLIC_KEY_HASH.ed)).toThrow();
    });
  });
  describe('safeSignEdData', () => {
    it('Verify correct message with ed curve', async () => {
      const curve = PUBLIC_KEY.ed.substring(0, 2) as curves;
      const _publicKey = new Uint8Array(toBuffer(b58cdecode(PUBLIC_KEY.ed, pref[curve].pk)));
      const sig = new Uint8Array(getSig(SIGNATURE.ed, curve, pref));
      const bytesHash = crypto_generichash(32, hex2buf(PAYLOAD.ed));
      const data = safeSignEdData(sig, bytesHash, _publicKey);
      expect(data).toBe(true);
    });
    it('Verify incorrect message with ed curve', async () => {
      const curve = PUBLIC_KEY.ed.substring(0, 2) as curves;
      const _publicKey = new Uint8Array(toBuffer(b58cdecode(PUBLIC_KEY.ed, pref[curve].pk)));
      const sig = new Uint8Array(getSig(SIGNATURE.ed, curve, pref));
      const bytesHash = crypto_generichash(32, hex2buf(WRONG_PAYLOAD));
      const data = safeSignEdData(sig, bytesHash, _publicKey);
      expect(data).toBe(false);
    });
  });
  describe('safeSignSpData', () => {
    it('Verify correct message with secp256k1 curve', async () => {
      const curve = PUBLIC_KEY.sp.substring(0, 2) as curves;
      const _publicKey = new Uint8Array(toBuffer(b58cdecode(PUBLIC_KEY.sp, pref[curve].pk)));
      const sig = new Uint8Array(getSig(SIGNATURE.sp, curve, pref));
      const bytesHash = crypto_generichash(32, hex2buf(PAYLOAD.sp));
      const data = safeSignSpData(sig, bytesHash, _publicKey);
      expect(data).toBe(true);
    });
    it('Verify incorrect message with secp256k1 curve', async () => {
      const curve = PUBLIC_KEY.sp.substring(0, 2) as curves;
      const _publicKey = new Uint8Array(toBuffer(b58cdecode(PUBLIC_KEY.sp, pref[curve].pk)));
      const sig = new Uint8Array(getSig(SIGNATURE.sp, curve, pref));
      const bytesHash = crypto_generichash(32, hex2buf(WRONG_PAYLOAD));
      const data = safeSignSpData(sig, bytesHash, _publicKey);
      expect(data).toBe(false);
    });
  });
  describe('safeSignP2Data', () => {
    it('Verify correct message with p256 curve', async () => {
      await ready;
      const curve = PUBLIC_KEY.p2.substring(0, 2) as curves;
      const _publicKey = new Uint8Array(toBuffer(b58cdecode(PUBLIC_KEY.p2, pref[curve].pk)));
      const sig = new Uint8Array(getSig(SIGNATURE.p2, curve, pref));
      const bytesHash = crypto_generichash(32, hex2buf(PAYLOAD.p2));
      const data = safeSignP2Data(sig, bytesHash, _publicKey);
      expect(data).toBe(true);
    });
    it('Verify incorrect message with p256 curve', async () => {
      await ready;
      const curve = PUBLIC_KEY.p2.substring(0, 2) as curves;
      const _publicKey = new Uint8Array(toBuffer(b58cdecode(PUBLIC_KEY.p2, pref[curve].pk)));
      const sig = new Uint8Array(getSig(SIGNATURE.p2, curve, pref));
      const bytesHash = crypto_generichash(32, hex2buf(WRONG_PAYLOAD));
      const data = safeSignP2Data(sig, bytesHash, _publicKey);
      expect(data).toBe(false);
    });
  });
  describe('getSig', () => {
    it('Get signature prefix', async () => {
      expect(() => getSig('sig123', null, null)).toThrow();
    });
    it('Get curve prefix', async () => {
      const curve = PUBLIC_KEY.p2.substring(0, 2) as curves;
      const sig = getSig(SIGNATURE.p2, curve, pref);
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
