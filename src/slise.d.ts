declare global {
  interface Window {
    adsbyslise?: { slot: string | number }[];
    adsbyslisesync?: () => void;
  }
}

export {};
