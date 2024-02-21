/**
 * (!) Apply this method in conjunction with `stringToArrayBuffer`
 * @return 'utf-8' encoded string
 */
export const arrayBufferToString = (buf: ArrayBuffer) =>
  String.fromCharCode.apply(
    null,
    // @ts-expect-error
    new Uint8Array(buf)
  );

/**
 * See: https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string
 *
 * @param str // 'utf-8' encoded string
 */
export const stringToArrayBuffer = (str: string) => {
  const buf = new ArrayBuffer(str.length); // 1 byte for each char
  const bufView = new Uint8Array(buf);
  const strLength = str.length;
  for (let i = 0; i < strLength; i++) bufView[i] = str.charCodeAt(i);
  return buf;
};

/**
 * (!) Apply this method in conjunction with `stringToUInt8Array`
 */
export const uInt8ArrayToString = (ui8a: Uint8Array) => new TextDecoder('utf-8').decode(ui8a);

export const stringToUInt8Array = (str: string) => new TextEncoder().encode(str);
