import createUseContext from "constate";

export type AppEnvironment = {
  windowType: WindowType;
};

export enum WindowType {
  Popup,
  FullPage
}

export const useAppEnvContext = createUseContext((env: AppEnvironment) => env);
