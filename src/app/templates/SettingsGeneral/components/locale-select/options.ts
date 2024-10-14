export interface LocaleOption {
  code: 'en' | 'en_GB' | 'fr' | 'de' | 'zh_CN' | 'zh_TW' | 'ja' | 'ko' | 'uk' | 'tr' | 'pt';
  disabled: boolean;
  flagName: string;
}

export const LOCALE_OPTIONS: LocaleOption[] = [
  {
    code: 'en',
    flagName: 'us',
    disabled: false
  },
  {
    code: 'en_GB',
    flagName: 'gb',
    disabled: false
  },
  {
    code: 'fr',
    flagName: 'fr',
    disabled: false
  },
  {
    code: 'de',
    flagName: 'de',
    disabled: false
  },
  {
    code: 'zh_CN',
    flagName: 'cn',
    disabled: false
  },
  {
    code: 'zh_TW',
    flagName: 'tw',
    disabled: false
  },
  {
    code: 'ja',
    flagName: 'jp',
    disabled: false
  },
  {
    code: 'ko',
    flagName: 'kr',
    disabled: false
  },
  {
    code: 'uk',
    flagName: 'ua',
    disabled: false
  },
  {
    code: 'tr',
    flagName: 'tr',
    disabled: false
  },
  {
    code: 'pt',
    flagName: 'pt',
    disabled: false
  }
];
