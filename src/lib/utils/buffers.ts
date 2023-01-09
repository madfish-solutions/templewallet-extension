/**
 * (!) Apply this method in conjunction with `stringToArrayBuffer`
 */
export const arrayBufferToString = (buf: ArrayBuffer) =>
  String.fromCharCode.apply(
    null,
    // @ts-ignore
    new Uint16Array(buf)
  );

/**
 * See: https://developer.chrome.com/blog/how-to-convert-arraybuffer-to-and-from-string
 *
 * @param str // String with 'utf-16' encoded characters
 */
export const stringToArrayBuffer = (str: string) => {
  const buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  const bufView = new Uint16Array(buf);
  const strLength = str.length;
  for (let i = 0; i < strLength; i++) bufView[i] = str.charCodeAt(i);
  return buf;
};

export const uInt8ArrayToString = (ui8a: Uint8Array) => new TextDecoder('utf-8').decode(ui8a);

export const stringToUInt8Array = (str: string) => new TextEncoder().encode(str);
