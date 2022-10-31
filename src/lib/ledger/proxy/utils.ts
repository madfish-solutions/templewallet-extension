export const uInt8ArrayToString = (ui8a: Uint8Array) => new TextDecoder('utf-8').decode(ui8a);

export const stringToUInt8Array = (str: string) => new TextEncoder().encode(str);
