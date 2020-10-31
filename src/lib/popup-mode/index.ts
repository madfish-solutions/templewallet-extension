export const POPUP_MODE_STORAGE_KEY = "popup_mode";
export const DEFAULT_POPUP_MODE = true;

export function setPopupMode(enabled: boolean) {
  localStorage.setItem(POPUP_MODE_STORAGE_KEY, JSON.stringify(enabled));
}

export function isPopupModeEnabled() {
  const stored = localStorage.getItem(POPUP_MODE_STORAGE_KEY);
  return stored ? (JSON.parse(stored) as boolean) : DEFAULT_POPUP_MODE;
}
