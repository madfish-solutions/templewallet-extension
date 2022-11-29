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
import * as path from 'path';
import ExtensionReloaderBadlyTyped, { ExtensionReloader as ExtensionReloaderType } from 'webpack-ext-reloader-mv3';
import WebExtension from 'webpack-target-webextension';
import WebpackBar from 'webpackbar';

import { buildBaseConfig } from './webpack/base.config';
import {
  DEVELOPMENT_ENV,
  PRODUCTION_ENV,
  TARGET_BROWSER,
  MANIFEST_VERSION,
  PATHS,
  RELOADER_PORTS
} from './webpack/consts';
import { buildManifest } from './webpack/manifest';
import { isTruthy } from './webpack/utils';

const ExtensionReloader = ExtensionReloaderBadlyTyped as ExtensionReloaderType;

const HTML_TEMPLATES = [
  {
    name: 'popup',
    path: path.join(PATHS.PUBLIC, 'popup.html')
  },
  {
    name: 'fullpage',
    path: path.join(PATHS.PUBLIC, 'fullpage.html')
  },
  {
    name: 'confirm',
    path: path.join(PATHS.PUBLIC, 'confirm.html')
  },
  {
    name: 'options',
    path: path.join(PATHS.PUBLIC, 'options.html')
  }
];

const SEPARATED_CHUNKS = new Set(['contentScript']);

const mainConfig = (() => {
  const config = buildBaseConfig();

  config.entry = {
    popup: path.join(PATHS.SOURCE, 'popup.tsx'),
    fullpage: path.join(PATHS.SOURCE, 'fullpage.tsx'),
    confirm: path.join(PATHS.SOURCE, 'confirm.tsx'),
    options: path.join(PATHS.SOURCE, 'options.tsx'),
    contentScript: path.join(PATHS.SOURCE, 'contentScript.ts')
  };

  config.output = {
    ...config.output,
    filename: 'scripts/[name].js',
    /*
      Not working like in WebPack v4.
      `optimization.splitChunks.cacheGroups.{cacheGroupKey}.name` overrides this.
    */
    chunkFilename: 'scripts/[name].chunk.js'
  };

  config.plugins!.push(
    ...[
      new WebpackBar({
        name: 'Temple Wallet | Main',
        color: '#ed8936'
      }),

      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [`**/*`, `!background/**`, PATHS.OUTPUT_PACKED],
        cleanStaleWebpackAssets: false,
        verbose: false
      }),

      new MiniCssExtractPlugin({
        filename: 'styles/[name].css',
        chunkFilename: 'styles/[name].chunk.css'
      }),

      ...HTML_TEMPLATES.map(
        htmlTemplate =>
          new HtmlWebpackPlugin({
            template: htmlTemplate.path,
            filename: path.basename(htmlTemplate.path),
            chunks: [htmlTemplate.name, 'commons'],
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

      // plugin to enable browser reloading in development mode
      DEVELOPMENT_ENV &&
        new ExtensionReloader({
          port: RELOADER_PORTS.FOREGROUND,
          reloadPage: true,
          // manifest: path.join(OUTPUT_PATH, "manifest.json"),
          entries: {
            contentScript: 'contentScript',
            extensionPage: ['popup', 'fullpage', 'confirm', 'options', 'commons.chunk']
          }
        })
    ].filter(isTruthy)
  );

  config.optimization!.splitChunks = {
    cacheGroups: {
      commons: {
        name: (_module: unknown, _chunks: unknown, cacheGroupKey: string) => `${cacheGroupKey}.chunk`,
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

const backgroundConfig = (() => {
  const config = buildBaseConfig();

  if (MANIFEST_VERSION === 3) config.target = 'webworker';

  config.entry = {
    background: path.join(PATHS.SOURCE, 'background.ts')
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

      MANIFEST_VERSION === 3 &&
        new WebExtension({
          background: {
            entry: 'background',
            manifest: MANIFEST_VERSION
          }
        }),

      // plugin to enable browser reloading in development mode
      DEVELOPMENT_ENV &&
        new ExtensionReloader({
          port: RELOADER_PORTS.BACKGROUND,
          reloadPage: true,
          // manifest: path.join(OUTPUT_PATH, "manifest.json"),
          entries: { background: 'background' }
        })
    ].filter(isTruthy)
  );

  return config;
})();

module.exports = [mainConfig, backgroundConfig];
// module.exports.parallelism = 1;
