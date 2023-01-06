export const UTORG_TERMS_LINK = 'https://app.utorg.pro/terms';
export const UTORG_PRIVICY_LINK = 'https://app.utorg.pro/privacy';

const UTORG_FIAT_ICONS_BASE_URL = 'https://utorg.pro/img/flags2/icon-';

export const buildIconSrc = (currencyCode: string) => `${UTORG_FIAT_ICONS_BASE_URL}${currencyCode.slice(0, -1)}.svg`;
