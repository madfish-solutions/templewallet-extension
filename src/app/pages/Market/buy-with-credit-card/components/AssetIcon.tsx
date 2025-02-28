import React, { memo, useCallback, useMemo, useState } from 'react';

import { Flag } from 'app/atoms/Flag';
import { TOKEN_FALLBACK_ICON_SRC, TOKENS_ICONS_SRC } from 'lib/icons';

interface Props {
  src: string;
  code: string;
  useFlagIcon?: boolean;
  size?: number;
  alt?: string;
}

export const AssetIcon = memo<Props>(({ src, code, useFlagIcon, size = 40, alt }) => {
  const [isFailed, setIsFailed] = useState(false);

  const countryCode = currencyToLocaleMap[code];

  const localSrc = useMemo(() => {
    if (isFailed) return TOKEN_FALLBACK_ICON_SRC;
    if (code === 'XTZ') return TOKENS_ICONS_SRC.TEZ;

    return src;
  }, [code, isFailed, src]);

  const handleError = useCallback(() => setIsFailed(true), []);

  return (
    <div className="flex justify-center items-center" style={{ width: size, height: size }}>
      {countryCode && useFlagIcon ? (
        <Flag alt={code} countryCode={countryCode} />
      ) : (
        <div className="flex justify-center items-center rounded-full w-9 h-9 overflow-hidden">
          <img src={localSrc} alt={alt} className="w-10 h-10 object-cover" onError={handleError} />
        </div>
      )}
    </div>
  );
});

const currencyToLocaleMap: Record<string, string> = {
  AED: 'ae',
  AFN: 'af',
  ALL: 'al',
  AMD: 'am',
  ANG: 'aw',
  AOA: 'ao',
  ARS: 'ar',
  AUD: 'au',
  AZN: 'az',
  BAM: 'ba',
  BBD: 'bb',
  BDT: 'bd',
  BGN: 'bg',
  BHD: 'bh',
  BIF: 'bi',
  BMD: 'bm',
  BND: 'bn',
  BOB: 'bo',
  BRL: 'br',
  BSD: 'bs',
  BTN: 'bt',
  BWP: 'bw',
  BYN: 'by',
  BZD: 'bz',
  CAD: 'ca',
  CDF: 'cd',
  CHF: 'ch',
  CLP: 'cl',
  CNY: 'cn',
  COP: 'co',
  CRC: 'cr',
  CUP: 'cu',
  CVE: 'cv',
  CZK: 'cz',
  DJF: 'dj',
  DKK: 'dk',
  DOP: 'do',
  DZD: 'dz',
  EGP: 'eg',
  ERN: 'er',
  ETB: 'et',
  EUR: 'eu',
  FJD: 'fj',
  FKP: 'fk',
  GBP: 'gb',
  GEL: 'ge',
  GHS: 'gh',
  GIP: 'gi',
  GMD: 'gm',
  GNF: 'gn',
  GTQ: 'gt',
  GYD: 'gy',
  HKD: 'hk',
  HNL: 'hn',
  HRK: 'hr',
  HTG: 'ht',
  HUF: 'hu',
  IDR: 'id',
  ILS: 'il',
  INR: 'in',
  IQD: 'iq',
  IRR: 'ir',
  ISK: 'is',
  JMD: 'jm',
  JOD: 'jo',
  JPY: 'jp',
  KES: 'ke',
  KGS: 'kg',
  KHR: 'kh',
  KMF: 'km',
  KPW: 'kp',
  KRW: 'kr',
  KWD: 'kw',
  KYD: 'ky',
  KZT: 'kz',
  LAK: 'la',
  LBP: 'lb',
  LKR: 'lk',
  LRD: 'lr',
  LSL: 'ls',
  LYD: 'ly',
  MAD: 'ma',
  MDL: 'md',
  MGA: 'mg',
  MKD: 'mk',
  MMK: 'mm',
  MNT: 'mn',
  MOP: 'mo',
  MRO: 'mr',
  MUR: 'mu',
  MVR: 'mv',
  MWK: 'mw',
  MXN: 'mx',
  MYR: 'my',
  MZN: 'mz',
  NAD: 'na',
  NGN: 'ng',
  NOK: 'no',
  NPR: 'np',
  NZD: 'nz',
  OMR: 'om',
  PEN: 'pe',
  PGK: 'pg',
  PHP: 'ph',
  PKR: 'pk',
  PLN: 'pl',
  PYG: 'py',
  QAR: 'qa',
  RON: 'ro',
  RSD: 'rs',
  RUB: 'ru',
  RWF: 'rw',
  SAR: 'sa',
  SBD: 'sb',
  SCR: 'sc',
  SDG: 'sd',
  SEK: 'se',
  SGD: 'sg',
  SHP: 'sh',
  SLL: 'sl',
  SOS: 'so',
  SRD: 'sr',
  SSP: 'ss',
  STD: 'st',
  SVC: 'sv',
  SYP: 'sy',
  SZL: 'sz',
  THB: 'th',
  TJS: 'tj',
  TMT: 'tm',
  TND: 'tn',
  TOP: 'to',
  TRY: 'tr',
  TTD: 'tt',
  TWD: 'tw',
  TZS: 'tz',
  UAH: 'ua',
  UGX: 'ug',
  USD: 'us',
  UYU: 'uy',
  UZS: 'uz',
  VND: 'vn',
  VUV: 'vu',
  WST: 'ws',
  XAF: 'cf',
  XCD: 'ag',
  XOF: 'bj',
  XPF: 'pf',
  YER: 'ye',
  ZAR: 'za',
  ZMW: 'zm',
  ZWL: 'zw'
};
