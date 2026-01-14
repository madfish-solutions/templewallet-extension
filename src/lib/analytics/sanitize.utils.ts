const ADDRESS_PATTERNS: Array<[RegExp, string]> = [
  [/(0x)[a-fA-F0-9]{40}/g, '$1[REDACTED]'],
  [/(tz[1-4])[1-9A-Za-z]{33}/g, '$1[REDACTED]']
];

export function sanitizeString(value: string): string {
  let result = value;

  for (const [pattern, replacement] of ADDRESS_PATTERNS) {
    result = result.replace(pattern, replacement);
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
