import { Signer } from "@taquito/taquito";

export class ReadOnlySigner implements Signer {
  constructor(private pkh: string, private pk: string) {}

  async publicKeyHash() {
    return this.pkh;
  }
  async publicKey() {
    return this.pk;
  }
  async secretKey(): Promise<string> {
    throw new Error("Secret key cannot be exposed");
  }
  async sign(): Promise<{
    bytes: string;
    sig: string;
    prefixSig: string;
    sbytes: string;
  }> {
    throw new Error("Cannot sign");
  }
}
