import { Signer } from "@taquito/taquito";

export class ReadOnlySigner implements Signer {
  constructor(
    private pkh: string,
    private pk: string,
    private onSign?: (digest: string) => void
  ) {}

  async publicKeyHash() {
    return this.pkh;
  }
  async publicKey() {
    return this.pk;
  }
  async secretKey(): Promise<string> {
    throw new Error("Secret key cannot be exposed");
  }
  async sign(
    digest: string
  ): Promise<{
    bytes: string;
    sig: string;
    prefixSig: string;
    sbytes: string;
  }> {
    if (this.onSign) {
      this.onSign(digest);
    }
    throw new Error("Cannot sign");
  }
}
