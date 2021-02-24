import {
  b58cdecode,
  b58cencode,
  buf2hex,
  hex2buf,
  isValidPrefix,
  mergebuf,
  prefix,
} from "@taquito/utils";
import sodium from "libsodium-wrappers";
import elliptic from "elliptic";
import toBuffer from "typedarray-to-buffer";
import {
  LedgerSigner,
  LedgerTransport,
  DerivationType,
} from "@taquito/ledger-signer";
import { PublicError } from "lib/temple/back/defaults";

type curves = "ed" | "p2" | "sp";

const pref = {
  ed: {
    pk: prefix["edpk"],
    sk: prefix["edsk"],
    pkh: prefix.tz1,
    sig: prefix.edsig,
  },
  p2: {
    pk: prefix["p2pk"],
    sk: prefix["p2sk"],
    pkh: prefix.tz3,
    sig: prefix.p2sig,
  },
  sp: {
    pk: prefix["sppk"],
    sk: prefix["spsk"],
    pkh: prefix.tz2,
    sig: prefix.spsig,
  },
};

export class TempleLedgerSigner extends LedgerSigner {
  constructor(
    transport: LedgerTransport,
    path: string = "44'/1729'/0'/0'",
    prompt: boolean = true,
    derivationType: DerivationType = DerivationType.ED25519,
    private accPublicKey?: string,
    private accPublicKeyHash?: string
  ) {
    super(transport, path, prompt, derivationType);
  }

  async publicKey() {
    return (
      this.accPublicKey ??
      super.publicKey().catch((err) => {
        throw toLedgerError(err);
      })
    );
  }

  async publicKeyHash() {
    return (
      this.accPublicKeyHash ??
      super.publicKeyHash().catch((err) => {
        throw toLedgerError(err);
      })
    );
  }

  async sign(bytes: string, watermark?: Uint8Array) {
    const result = await super.sign(bytes, watermark).catch((err) => {
      throw toLedgerError(err);
    });

    let bb = hex2buf(bytes);
    if (typeof watermark !== "undefined") {
      bb = mergebuf(watermark, bb);
    }
    const watermarkedBytes = buf2hex(toBuffer(bb));
    const signatureVerified = await this.verify(
      watermarkedBytes,
      result.prefixSig
    );

    if (!signatureVerified) {
      throw toLedgerError(
        new Error(
          "Signature failed verification against public key." +
            " Maybe the account on your device does not match" +
            " the account from which you are trying to perform the action."
        )
      );
    }

    return result;
  }

  async verify(bytes: string, signature: string) {
    await sodium.ready;
    const publicKey = await this.publicKey();
    const pkh = await this.publicKeyHash();
    const curve = publicKey.substring(0, 2) as curves;
    const _publicKey = toBuffer(b58cdecode(publicKey, pref[curve].pk));

    let signaturePrefix = signature.startsWith("sig")
      ? signature.substr(0, 3)
      : signature.substr(0, 5);

    if (!isValidPrefix(signaturePrefix)) {
      throw new Error(
        `Unsupported signature given by remote signer: ${signature}`
      );
    }

    const publicKeyHash = b58cencode(
      sodium.crypto_generichash(20, _publicKey),
      pref[curve].pkh
    );
    if (publicKeyHash !== pkh) {
      throw new Error(
        `Requested public key does not match the initialized public key hash: {
          publicKey: ${publicKey},
          publicKeyHash: ${pkh}
        }`
      );
    }

    let sig;
    if (signature.substring(0, 3) === "sig") {
      sig = b58cdecode(signature, prefix.sig);
    } else if (signature.substring(0, 5) === `${curve}sig`) {
      sig = b58cdecode(signature, pref[curve].sig);
    } else {
      throw new Error(`Invalid signature provided: ${signature}`);
    }

    const bytesHash = sodium.crypto_generichash(32, hex2buf(bytes));

    if (curve === "ed") {
      try {
        return sodium.crypto_sign_verify_detached(sig, bytesHash, _publicKey);
      } catch (e) {
        return false;
      }
    }

    if (curve === "sp") {
      const key = new elliptic.ec("secp256k1").keyFromPublic(_publicKey);
      const hexSig = buf2hex(toBuffer(sig));
      const match = hexSig.match(/([a-f\d]{64})/gi);
      if (match) {
        try {
          const [r, s] = match;
          return key.verify(bytesHash, { r, s });
        } catch (e) {
          return false;
        }
      }
      return false;
    }

    if (curve === "p2") {
      const key = new elliptic.ec("p256").keyFromPublic(_publicKey);
      const hexSig = buf2hex(toBuffer(sig));
      const match = hexSig.match(/([a-f\d]{64})/gi);
      if (match) {
        try {
          const [r, s] = match;
          return key.verify(bytesHash, { r, s });
        } catch (e) {
          return false;
        }
      }
      return false;
    }

    throw new Error(`Curve '${curve}' not supported`);
  }
}

function toLedgerError(err: any) {
  return new PublicError(`Ledger error. ${err.message}`);
}
