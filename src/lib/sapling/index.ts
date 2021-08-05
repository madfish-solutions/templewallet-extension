// @ts-nocheck
import {
  TezosSaplingAddress,
  TezosProtocolNetwork,
  TezosSaplingBuilder,
  TezosSaplingProtocolOptions,
  TezosShieldedTezProtocolConfig,
  NetworkType,
} from "../../../node_modules/@temple-wallet/tezos-sapling-js/dist"
import { getOrFetchParameters } from "./params-downloader"

export {
  TezosSaplingAddress
}

const CONTRACT_ADDRESS = "KT1FfAmKCXegpJTxKP1Rz35irEpLA8s18QQJ"

export const JULIAN_VIEWING_KEY =
  "0000000000000000004e836dac37234f08916ee886c8a6834816a0520b3d666bd4edf42130f826cae2379a26861252d22605e041b3ec6e19449a23863bce9ff20b78615a58446f7106f31f7a3d0efed751de9585116f73dbab76955d9b4d4378ed256792d57dce70e3cbbfaef401b0736255d060619f357c81c17074e1007d448bae942a19d33836da047bf52a95387da1b811a35b89eb3c8f46089208d5785445c01d382b9a153df9"

export const JULIAN_SPENDING_KEY = Buffer.from(
  "0000000000000000004e836dac37234f08916ee886c8a6834816a0520b3d666bd4edf42130f826cae2f2f0a4269a23688eabaa3fbfb6129597d4d18416b82ee357ee2e56b3ccf212059132f42f1aa75413d6ca57d6c288db3cb0125dfe078f678ef25627fc5862880acbbfaef401b0736255d060619f357c81c17074e1007d448bae942a19d33836da047bf52a95387da1b811a35b89eb3c8f46089208d5785445c01d382b9a153df9",
  "hex"
)

export let saplingBuilder: TezosSaplingBuilder

export async function initializeSapling() {
  const options = new TezosSaplingProtocolOptions(
    new TezosProtocolNetwork(
      NetworkType.TESTNET,
      "florencenet",
      "https://florencenet.smartpy.io/"
    ),
    new TezosShieldedTezProtocolConfig("Shielded contract", CONTRACT_ADDRESS)
  )

  let addr = await TezosSaplingAddress.fromViewingKey(JULIAN_VIEWING_KEY)
  console.log("julian address", addr)

  saplingBuilder = new TezosSaplingBuilder(options)
  const [spendParams, outputParams] = await getOrFetchParameters()

  console.log("init with params: ", spendParams)

  saplingBuilder.initParameters(spendParams, outputParams)

  return saplingBuilder
}
