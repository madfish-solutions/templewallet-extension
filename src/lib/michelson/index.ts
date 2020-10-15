import BigNumber from "bignumber.js";
export const transferImplicit = (key: string, mutez: BigNumber) => {
  return [
    { prim: "DROP" },
    { prim: "NIL", args: [{ prim: "operation" }] },
    {
      prim: "PUSH",
      args: [{ prim: "key_hash" }, { string: key }],
    },
    { prim: "IMPLICIT_ACCOUNT" },
    {
      prim: "PUSH",
      args: [{ prim: "mutez" }, { int: mutez.toFixed() }],
    },
    { prim: "UNIT" },
    { prim: "TRANSFER_TOKENS" },
    { prim: "CONS" },
  ];
};
