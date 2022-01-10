import { b58cdecode, b58decode, hex2buf } from '@taquito/utils';
import { LedgerTempleBridgeTransport } from '@temple-wallet/ledger-bridge';
import * as sodium from 'libsodium-wrappers';
import { browser } from 'webextension-polyfill-ts';

import toBuffer from 'typedarray-to-buffer';

import { curves, getSig, pref, safeSignEdData, TempleLedgerSigner } from './ledger-signer';

describe('Ledger Signer tests', () => {
  describe('Signature curve', () => {
    // it('Sign ed curve', async () => {
    //   await sodium.ready;
    //   const bridgeUrl = process.env.TEMPLE_WALLET_LEDGER_BRIDGE_URL!;
    //   const transport = await LedgerTempleBridgeTransport.open(bridgeUrl);
    //   const twt = new TempleLedgerSigner(transport);
    //   const bytesPayload =
    //     '05010000004254657a6f73205369676e6564204d6573736167653a206d79646170702e636f6d20323032312d30312d31345431353a31363a30345a2048656c6c6f20776f726c6421';
    //   const res = twt.sign(bytesPayload);
    //   // console.log(res);
    //   expect(res).toBe('true');
    //   //   const storageKey = toPubKeyStorageKey('myAwesomeDappKey');
    //   //   expect(storageKey).toBe('beacon_myAwesomeDappKey_pubkey');
    // });
    it('Verify ed curve', async () => {
      await sodium.ready;

      // 616e7920737472696e6720746861742077696c6c206265207369676e6564
      // 0501313230363136653739323037333734373236393665363732303734363836313734323037373639366336633230363236353230373336393637366536353634
      // edsigtyb1zfVFHCxy458ZqZ1s4CGJdhrV6ocgj3JxpMj3qX6vHEaYKnifTPFNirwxznPW3xBrTWWrDdu2qDoJqCPNQi3DVMc8dS
      // tz1gohAk1nxzdKTt76iXeynpZESwTEMnjRq8
      const bytesPayload =
        '0501313230363136653739323037333734373236393665363732303734363836313734323037373639366336633230363236353230373336393637366536353634';
      const signature =
        'edsigtyb1zfVFHCxy458ZqZ1s4CGJdhrV6ocgj3JxpMj3qX6vHEaYKnifTPFNirwxznPW3xBrTWWrDdu2qDoJqCPNQi3DVMc8dS';
      const res = b58decode(
        'edsigtyb1zfVFHCxy458ZqZ1s4CGJdhrV6ocgj3JxpMj3qX6vHEaYKnifTPFNirwxznPW3xBrTWWrDdu2qDoJqCPNQi3DVMc8dS'
      );
      const publicKey = 'edpkunHr4t3DErGD1uGzX78uyZ9uHwRvVF9ASMArNvQxKnwuoxYNZK';
      const privateKey =
        'edskRyjosWqCEL7EAWAPv9iNNSCvAMjejXimPsZjr4USAzSjvgKFfVHd5Q5Xeu8viH1SgJ1vWa3fTfKw6axtpiju7g7nvTXSRY';
      const pkh = 'tz1Q7DbSZdM1RfBZwey1eRNia22uPpg5Hpyo';
      const curve = publicKey.substring(0, 2) as curves;
      const _publicKey = toBuffer(b58cdecode(publicKey, pref[curve].pk));
      let sig = getSig(signature, curve, pref);
      const bytesHash = sodium.crypto_generichash(32, hex2buf(bytesPayload));
      const data = safeSignEdData(sig, bytesHash, _publicKey);
      console.log(res);
      expect(sig).toBe('true');
      //   const storageKey = toPubKeyStorageKey('myAwesomeDappKey');
      //   expect(storageKey).toBe('beacon_myAwesomeDappKey_pubkey');
    });
  });
});
