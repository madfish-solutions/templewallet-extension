import * as localforage from "localforage"

const SPEND_PARAMS_FILE_NAME = "sapling-spend.params"
const OUTPUT_PARAMS_FILE_NAME = "sapling-output.params"
const ZCASH_DOWNLOAD_URL = "https://download.z.cash/downloads"

export async function getOrFetchParameters(): Promise<[Uint8Array, Uint8Array]> {
  return Promise.all([
    prepareParams(SPEND_PARAMS_FILE_NAME),
    prepareParams(OUTPUT_PARAMS_FILE_NAME),
  ])
}

async function fetchSaplingParams(name: string): Promise<Uint8Array> {
  const arrayBuffer = await fetch(`${ZCASH_DOWNLOAD_URL}/${name}`).then(
    (resp) => resp.arrayBuffer()
  )
  const byteArray = new Uint8Array(arrayBuffer)
  await localforage.setItem(name, byteArray)

  return byteArray
}

async function prepareParams(name: string): Promise<Uint8Array> {
  let byteArray: Uint8Array | null = await localforage.getItem(name)

  if (byteArray == null) {
    byteArray = await fetchSaplingParams(name)
  }

  return byteArray
}
