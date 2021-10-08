/**
 * Generic helpers used across the application
 */

import BigNumber from "bignumber.js";

import * as Helpers from "../helpers";

let address: string;

describe("Helpers", () => {
  it("atomsToTokens", async () => {
    const atomsValue = new BigNumber(1_000_000_000_000);
    const realValue = Helpers.atomsToTokens(atomsValue, 9);
    expect(realValue.toFixed()).toBe("1000");
  });

  it("tokensToAtoms", async () => {
    const realValue = new BigNumber(1000);
    const atomsValue = Helpers.tokensToAtoms(realValue, 9);
    expect(atomsValue.toFixed()).toBe("1000000000000");
  });

  it("atomsToTokens", async () => {
    let params: any = { kind: "transaction", script: {} };
    expect(Helpers.formatOpParamsBeforeSend(params)).toBe(params);

    params = { kind: "origination" };
    expect(Helpers.formatOpParamsBeforeSend(params)).toBe(params);

    params = {
      kind: "origination",
      script: { a: "A" },
      storage: { b: "B" },
    };
    expect(Helpers.formatOpParamsBeforeSend(params)).toStrictEqual({
      kind: "origination",
      a: "A",
      init: { b: "B" },
    });
  });

  it("isAddressValid", async () => {
    address = "asdasdasd";
    expect(Helpers.isAddressValid(address)).toBeFalsy();

    address = "tz1asdasd";
    expect(Helpers.isAddressValid(address)).toBeFalsy();

    address = "tz1ZfrERcALBwmAqwonRXYVQBDT9BjNjBHJu";
    expect(Helpers.isAddressValid(address)).toBeTruthy();

    address = "tz2Ch1abG7FNiibmV26Uzgdsnfni9XGrk5wD";
    expect(Helpers.isAddressValid(address)).toBeTruthy();

    address = "tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At";
    expect(Helpers.isAddressValid(address)).toBeTruthy();

    address = "KT1EyH6KR9STvgiet4ahrtBf7WCnmJovvJa1";
    expect(Helpers.isAddressValid(address)).toBeTruthy();
  });

  it("isKTAddress", async () => {
    address = "tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At";
    expect(Helpers.isKTAddress(address)).toBeFalsy();

    address = "KT1EyH6KR9STvgiet4ahrtBf7WCnmJovvJa1";
    expect(Helpers.isKTAddress(address)).toBeTruthy();
  });

  it("isKTAddress", async () => {
    address = "asdasd";
    expect(Helpers.validateContractAddress(address)).toBe(
      "Translated<invalidAddress>"
    );

    address = "tz3Lfm6CyfSTZ7EgMckptZZGiPxzs9GK59At";
    expect(Helpers.validateContractAddress(address)).toBe(
      "Translated<onlyKTContractAddressAllowed>"
    );

    address = "KT1EyH6KR9STvgiet4ahrtBf7WCnmJovvJa1";
    expect(Helpers.validateContractAddress(address)).toBeTruthy();
  });

  it("mutezToTz & tzToMutez", async () => {
    expect(Helpers.mutezToTz(1_000_000).toFixed()).toBe("1");
    expect(Helpers.tzToMutez(1).toFixed()).toBe("1000000");
  });

  it("usdToAssetAmount", async () => {
    const usd = new BigNumber(1);
    const assetUsdPrice = 5;
    const assetDecimals = 6;
    const value = Helpers.usdToAssetAmount(usd, assetUsdPrice, assetDecimals);
    expect(value?.toFixed()).toBe("0.2");
  });

  it("validateDerivationPath", async () => {
    expect(Helpers.validateDerivationPath("44'/1729'/0'/0'")).toBe(
      "Translated<derivationPathMustStartWithM>"
    );
    expect(Helpers.validateDerivationPath("m44'/1729'/0'/0'")).toBe(
      "Translated<derivationSeparatorMustBeSlash>"
    );
    expect(Helpers.validateDerivationPath("m/44'/asd'/0'/0'")).toBe(
      "Translated<invalidPath>"
    );
    expect(Helpers.validateDerivationPath("m/44'/1729'/0'/0'")).toBeTruthy();
  });
});
