import browser from 'webextension-polyfill';

export const IS_DEV_ENV = process.env.NODE_ENV === 'development';

export const isPopupWindow = () => browser.extension.getViews({ type: 'popup' }).includes(window);
