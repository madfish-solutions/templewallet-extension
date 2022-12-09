/*
  Reference for this config:
  https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js
*/

import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import CreateFileWebpack from 'create-file-webpack';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as Path from 'path';
import ExtensionReloaderBadlyTyped, { ExtensionReloader as ExtensionReloaderType } from 'webpack-ext-reloader';
import ExtensionReloaderMV3BadlyTyped, {
  ExtensionReloader as ExtensionReloaderMV3Type
} from 'webpack-ext-reloader-mv3';
import WebExtensionTargetPlugin from 'webpack-target-webextension';
import WebpackBar from 'webpackbar';

import { buildBaseConfig } from './webpack/base.config';
import {
  DEVELOPMENT_ENV,
  PRODUCTION_ENV,
  TARGET_BROWSER,
  MANIFEST_VERSION,
  BACKGROUND_IS_WORKER,
  RELOADER_PORTS
} from './webpack/env';
import { buildManifest } from './webpack/manifest';
import { PATHS } from './webpack/paths';
import { isTruthy } from './webpack/utils';

const ExtensionReloader = ExtensionReloaderBadlyTyped as ExtensionReloaderType;
const ExtensionReloaderMV3 = ExtensionReloaderMV3BadlyTyped as ExtensionReloaderMV3Type;

const PAGES_NAMES = ['popup', 'fullpage', 'confirm', 'options'];
const HTML_TEMPLATES = PAGES_NAMES.map(name => {
  const filename = `${name}.html`;
  const path = Path.join(PATHS.PUBLIC, filename);
  return { name, filename, path };
});

const CONTENT_SCRIPTS = ['contentScript'];
if (BACKGROUND_IS_WORKER) CONTENT_SCRIPTS.push('keepBackgroundWorkerAlive');
const SEPARATED_CHUNKS = new Set(CONTENT_SCRIPTS);

const mainConfig = (() => {
  const config = buildBaseConfig();

  config.entry = {
    popup: Path.join(PATHS.SOURCE, 'popup.tsx'),
    fullpage: Path.join(PATHS.SOURCE, 'fullpage.tsx'),
    confirm: Path.join(PATHS.SOURCE, 'confirm.tsx'),
    options: Path.join(PATHS.SOURCE, 'options.tsx')
  };

  config.output = {
    ...config.output,
    filename: 'pages/[name].js',
    chunkFilename: 'pages/[name].chunk.js'
  };

  config.plugins!.push(
    ...[
      new WebpackBar({
        name: 'Temple Wallet | Main',
        color: '#ed8936'
      }),

      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [`**/*`, `!scripts/**`, `!background/**`, PATHS.OUTPUT_PACKED],
        cleanStaleWebpackAssets: false,
        verbose: false
      }),

      new MiniCssExtractPlugin({
        filename: 'styles/[name].css',
        chunkFilename: 'styles/[name].chunk.css'
      }),

      ...HTML_TEMPLATES.map(
        ({ name, filename, path }) =>
          new HtmlWebpackPlugin({
            template: path,
            filename,
            chunks: [name],
            inject: 'body',
            ...(PRODUCTION_ENV
              ? {
                  minify: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeStyleLinkTypeAttributes: true,
                    keepClosingSlash: true,
                    minifyJS: true,
                    minifyCSS: true,
                    minifyURLs: true
                  }
                }
              : {})
          })
      ),

      new CopyWebpackPlugin({
        patterns: [
          {
            from: PATHS.PUBLIC,
            to: PATHS.OUTPUT,
            globOptions: {
              /*
                - HTML files are taken care of by the `html-webpack-plugin`. Copying them here leads to:
                  `ERROR in Conflict: Multiple assets emit different content to the same filename [name].html`
                - Manifest file is copied next, along with transformation of it.
              */
              ignore: ['**/*.html']
            }
          }
        ]
      }),

      new CreateFileWebpack({
        path: PATHS.OUTPUT,
        fileName: 'manifest.json',
        content: (() => {
          const manifest = buildManifest(TARGET_BROWSER);
          return JSON.stringify(manifest, null, 2);
        })()
      }),

      /* Page reloading in development mode */
      DEVELOPMENT_ENV &&
        new ExtensionReloader({
          port: RELOADER_PORTS.PAGES,
          reloadPage: true,
          entries: {
            extensionPage: [...PAGES_NAMES, 'commons.chunk']
          }
        })
    ].filter(isTruthy)
  );

  config.optimization!.splitChunks = {
    cacheGroups: {
      commons: {
        name: 'commons.chunk',
        minChunks: 2,
        chunks: chunk => !SEPARATED_CHUNKS.has(chunk.name)
      }
    }
  };

  config.optimization!.minimizer!.push(
    // This is only used in production mode
    new CssMinimizerPlugin()
  );

  return config;
})();

const scriptsConfig = (() => {
  const config = buildBaseConfig();

  config.entry = {
    contentScript: Path.join(PATHS.SOURCE, 'contentScript.ts')
  };

  if (BACKGROUND_IS_WORKER)
    config.entry.keepBackgroundWorkerAlive = Path.join(PATHS.SOURCE, 'keepBackgroundWorkerAlive.ts');

  config.output = {
    ...config.output,
    filename: 'scripts/[name].js',
    chunkFilename: 'scripts/[name].chunk.js'
  };

  config.plugins!.push(
    ...[
      new WebpackBar({
        name: 'Temple Wallet | Scripts',
        color: '#ed8936'
      }),

      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['scripts/**'],
        cleanStaleWebpackAssets: false,
        verbose: false
      }),

      /* Page reloading in development mode */
      DEVELOPMENT_ENV &&
        new ExtensionReloader({
          port: RELOADER_PORTS.SCRIPTS,
          reloadPage: true,
          entries: {
            background: '',
            contentScript: CONTENT_SCRIPTS
          }
        })
    ].filter(isTruthy)
  );

  return config;
})();

const backgroundConfig = (() => {
  const config = buildBaseConfig();

  if (BACKGROUND_IS_WORKER) config.target = 'webworker';

  config.entry = {
    background: Path.join(PATHS.SOURCE, 'background.ts')
  };

  config.output = {
    ...config.output,
    filename: 'background/index.js',
    chunkFilename: 'background/[name].chunk.js'
  };

  config.plugins!.push(
    ...[
      new WebpackBar({
        name: 'Temple Wallet | Background',
        color: '#ed8936'
      }),

      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: ['background/**'],
        cleanStaleWebpackAssets: false,
        verbose: false
      }),

      new CopyWebpackPlugin({
        patterns: [{ from: PATHS.WASM, to: PATHS.OUTPUT_BACKGROUND }]
      }),

      /*
        Handling dynamic imports, converted to ServiceWorker's `importScripts`, and failing
        over being called deferred, not at the root of the script.
      */
      BACKGROUND_IS_WORKER &&
        new WebExtensionTargetPlugin({
          background: {
            entry: 'background',
            manifest: MANIFEST_VERSION
          }
        }),

      /* Page reloading in development mode */
      DEVELOPMENT_ENV &&
        new ExtensionReloaderMV3({
          port: RELOADER_PORTS.BACKGROUND,
          reloadPage: true,
          entries: { background: 'background', contentScript: '' }
        })
    ].filter(isTruthy)
  );

  return config;
})();

module.exports = [mainConfig, scriptsConfig, backgroundConfig];
// module.exports.parallelism = 1;
