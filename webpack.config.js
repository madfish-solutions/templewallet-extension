/*
  Reference for this config:
  https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js
*/

const CopyWebpackPlugin = require('copy-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const ExtensionReloader = require('webpack-ext-reloader-mv3');
const WebpackBar = require('webpackbar');

const { buildBaseConfig } = require('./webpack/base.config');
const {
  NODE_ENV,
  TARGET_BROWSER,
  SOURCE_PATH,
  PUBLIC_PATH,
  WASM_PATH,
  OUTPUT_PATH,
  SCRIPTS_PATH
} = require('./webpack/consts');

require('./webpack/cleanup');

const HTML_TEMPLATES = [
  {
    name: 'popup',
    path: path.join(PUBLIC_PATH, 'popup.html')
  },
  {
    name: 'fullpage',
    path: path.join(PUBLIC_PATH, 'fullpage.html')
  },
  {
    name: 'confirm',
    path: path.join(PUBLIC_PATH, 'confirm.html')
  },
  {
    name: 'options',
    path: path.join(PUBLIC_PATH, 'options.html')
  }
];

const SEPARATED_CHUNKS = new Set(['background', 'contentScript']);
const MANIFEST_PATH = path.join(PUBLIC_PATH, 'manifest.json');

const mainConfig = (() => {
  const config = buildBaseConfig();

  config.entry = {
    popup: path.join(SOURCE_PATH, 'popup.tsx'),
    fullpage: path.join(SOURCE_PATH, 'fullpage.tsx'),
    confirm: path.join(SOURCE_PATH, 'confirm.tsx'),
    options: path.join(SOURCE_PATH, 'options.tsx'),
    contentScript: path.join(SOURCE_PATH, 'contentScript.ts')
  };

  config.plugins.push(
    ...[
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
            from: PUBLIC_PATH,
            to: OUTPUT_PATH,
            globOptions: {
              /*
              - HTML files are taken care of by the `html-webpack-plugin`. Copying them here leads to:
                `ERROR in Conflict: Multiple assets emit different content to the same filename [name].html`
              - Manifest file is copied next with transformation of it.
            */
              ignore: ['**/*.html', '**/manifest.json']
            }
          },
          {
            from: MANIFEST_PATH,
            to: path.join(OUTPUT_PATH, 'manifest.json'),
            toType: 'file',
            transform: content => {
              const manifest = transformManifestKeys(JSON.parse(content), TARGET_BROWSER);
              return JSON.stringify(manifest, null, 2);
            }
          },
          {
            from: WASM_PATH,
            to: SCRIPTS_PATH
          }
        ]
      }),

      new WebpackBar({
        name: 'Temple Wallet | Main',
        color: '#ed8936'
      }),

      // plugin to enable browser reloading in development mode
      NODE_ENV === 'development' &&
        new ExtensionReloader({
          port: 9091,
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
    background: path.join(SOURCE_PATH, 'background.ts')
  };

  config.plugins.push(
    ...[
      new WebpackBar({
        name: 'Temple Wallet | Background',
        color: '#ed8936'
      }),

      // plugin to enable browser reloading in development mode
      NODE_ENV === 'development' &&
        new ExtensionReloader({
          port: 9090,
          reloadPage: true,
          // manifest: path.join(OUTPUT_PATH, "manifest.json"),
          entries: {
            background: 'background'
          }
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
