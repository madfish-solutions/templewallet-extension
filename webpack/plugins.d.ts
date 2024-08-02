declare module 'react-dev-utils/ForkTsCheckerWebpackPlugin' {
  export { default } from 'fork-ts-checker-webpack-plugin';
}

declare module 'react-dev-utils/ModuleNotFoundPlugin';
declare module 'create-file-webpack';
declare module '@temple-wallet/save-remote-file-webpack-plugin';

declare module 'postcss-preset-env' {
  // For broken `index.d.ts` of `postcss-preset-env`
  // eslint-disable-next-line import/no-unresolved
  export { default } from 'node_modules/postcss-preset-env/dist/index';
}
