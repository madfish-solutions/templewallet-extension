import { browser } from "webextension-polyfill-ts"

const SPEND_PARAMS_FILE_NAME = "sapling-spend.params"
const OUTPUT_PARAMS_FILE_NAME = "sapling-output.params"
const ZCASH_DOWNLOAD_URL = "https://download.z.cash/downloads"

export async function getOrFetchParameters(): Promise<[Buffer, Buffer]> {
  return Promise.all([
    prepareParams(SPEND_PARAMS_FILE_NAME),
    prepareParams(OUTPUT_PARAMS_FILE_NAME),
  ])
}

async function fetchSaplingParams(name: string): Promise<Buffer> {
  const arrayBuffer = await fetch(`${ZCASH_DOWNLOAD_URL}/${name}`).then(
    (resp) => resp.arrayBuffer()
  )

  var buffer = Buffer.from(arrayBuffer)

  await browser.storage.local.set({ [name]: buffer })

  return buffer
}

async function prepareParams(name: string): Promise<Buffer> {
  let params = await browser.storage.local.get([name])
  const exist = name in params
  if (!exist) {
    console.log("No sapling params found. Fetching ones...")
    await fetchSaplingParams(name)
  }

  params = await browser.storage.local.get([name])
  console.log("Params from storage")
  console.log(params[name])

  return params[name]
}
