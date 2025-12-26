const ADDRESS_PATTERNS = [/0x[a-fA-F0-9]{40}/g, /tz[1-3][1-9A-Za-z]{33}/g, /KT1[1-9A-Za-z]{33}/g];

const SECRET_PATTERNS = [/(mnemonic|seed phrase|seed|private key|secret key|recovery phrase|passphrase|password)/gi];

const REDACTED = '[REDACTED]';

export function sanitizeString(value: string): string {
  let result = value;

  for (const pattern of ADDRESS_PATTERNS) {
    result = result.replace(pattern, REDACTED);
  }

  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, REDACTED);
  }

  return result;
}

export function sanitizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const cleaned = `${url.origin}${url.pathname}`;
    return sanitizeString(cleaned);
  } catch {
    return sanitizeString(raw);
  }
}

export function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (Array.isArray(value)) {
    return value.map(v => sanitizeValue(v));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => [k, sanitizeValue(v)]);
    return Object.fromEntries(entries);
  }

  return value;
}
