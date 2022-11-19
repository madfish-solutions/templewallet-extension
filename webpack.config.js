/*
  Reference for this config:
  https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js
*/

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const ExtensionReloader = require('webpack-ext-reloader-mv3');
const WebpackBar = require('webpackbar');

const { buildBaseConfig } = require('./webpack/base.config');
const { NODE_ENV, DEVELOPMENT_ENV, TARGET_BROWSER, PATHS, RELOADER_PORTS } = require('./webpack/consts');

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

const SEPARATED_CHUNKS = new Set(['background', 'contentScript']);

const mainConfig = (() => {
  const config = buildBaseConfig();

  config.entry = {
    popup: path.join(PATHS.SOURCE, 'popup.tsx'),
    fullpage: path.join(PATHS.SOURCE, 'fullpage.tsx'),
    confirm: path.join(PATHS.SOURCE, 'confirm.tsx'),
    options: path.join(PATHS.SOURCE, 'options.tsx'),
    contentScript: path.join(PATHS.SOURCE, 'contentScript.ts')
  };

  config.plugins.push(
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
            ...(NODE_ENV === 'production'
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
              ignore: ['**/*.html', '**/manifest.json']
            }
          },
          {
            from: path.join(PATHS.PUBLIC, 'manifest.json'),
            to: path.join(PATHS.OUTPUT, 'manifest.json'),
            toType: 'file',
            transform: content => {
              const manifest = transformManifestKeys(JSON.parse(content), TARGET_BROWSER);
              return JSON.stringify(manifest, null, 2);
            }
          },
          { from: PATHS.WASM, to: PATHS.OUTPUT_SCRIPTS }
        ]
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
    ].filter(Boolean)
  );

  config.optimization.splitChunks = {
    cacheGroups: {
      commons: {
        name: (module, chunks, cacheGroupKey) => `${cacheGroupKey}.chunk`,
        minChunks: 2,
        chunks: chunk => !SEPARATED_CHUNKS.has(chunk.name)
      }
    }
  };

  config.optimization.minimizer.push(
    // This is only used in production mode
    new CssMinimizerPlugin()
  );

  return config;
})();

const backgroundConfig = (() => {
  const config = buildBaseConfig();

  config.target = 'webworker';

  config.entry = {
    background: path.join(PATHS.SOURCE, 'background.ts')
  };

  config.output.filename = 'background/index.js';

  config.plugins.push(
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

      // plugin to enable browser reloading in development mode
      DEVELOPMENT_ENV &&
        new ExtensionReloader({
          port: RELOADER_PORTS.BACKGROUND,
          reloadPage: true,
          // manifest: path.join(OUTPUT_PATH, "manifest.json"),
          entries: { background: 'background' }
        })
    ].filter(Boolean)
  );

  return config;
})();

module.exports = [mainConfig, backgroundConfig];
// module.exports.parallelism = 1;

/**
 *  Fork of `wext-manifest`
 */
const browserVendors = ['chrome', 'firefox', 'opera', 'edge', 'safari'];
const vendorRegExp = new RegExp(`^__((?:(?:${browserVendors.join('|')})\\|?)+)__(.*)`);

const transformManifestKeys = (manifest, vendor) => {
  if (Array.isArray(manifest)) {
    return manifest.map(newManifest => {
      return transformManifestKeys(newManifest, vendor);
    });
  }

  if (typeof manifest === 'object') {
    return Object.entries(manifest).reduce((newManifest, [key, value]) => {
      const match = key.match(vendorRegExp);

      if (match) {
        const vendors = match[1].split('|');

        // Swap key with non prefixed name
        if (vendors.indexOf(vendor) > -1) {
          newManifest[match[2]] = value;
        }
      } else {
        newManifest[key] = transformManifestKeys(value, vendor);
      }

      return newManifest;
    }, {});
  }

  return manifest;
};
