const POPUP_MODE_STORAGE_KEY = 'popup_mode';
const DEFAULT_POPUP_MODE = true;

export function setPopupMode(enabled: boolean) {
  localStorage.setItem(POPUP_MODE_STORAGE_KEY, String(enabled));
}

export function isPopupModeEnabled() {
  const stored = localStorage.getItem(POPUP_MODE_STORAGE_KEY);
  return stored ? stored === 'true' : DEFAULT_POPUP_MODE;
}
