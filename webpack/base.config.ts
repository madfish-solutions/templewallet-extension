/*
  Reference for this config:
  https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js
*/

import ESLintPlugin from 'eslint-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import * as path from 'path';
import postcssPresetEnv from 'postcss-preset-env';
import ForkTsCheckerWebpackPlugin from 'react-dev-utils/ForkTsCheckerWebpackPlugin';
import getCSSModuleLocalIdent from 'react-dev-utils/getCSSModuleLocalIdent';
import ModuleNotFoundPlugin from 'react-dev-utils/ModuleNotFoundPlugin';
import resolve from 'resolve';
import TerserPlugin from 'terser-webpack-plugin';
import WebPack from 'webpack';

import { Config as SvgrLoaderOptions } from '../node_modules/@svgr/core/dist';
import packageJSON from '../package.json';
import tsConfig from '../tsconfig.json';

import { envFilesData } from './dotenv';
import {
  NODE_ENV,
  WEBPACK_MODE,
  DEVELOPMENT_ENV,
  PRODUCTION_ENV,
  TARGET_BROWSER,
  DROP_CONSOLE_IN_PROD,
  SOURCE_MAP,
  MANIFEST_VERSION,
  BACKGROUND_IS_WORKER,
  IMAGE_INLINE_SIZE_LIMIT_ENV,
  IS_CORE_BUILD
} from './env';
import { PATHS } from './paths';

const VERSION = packageJSON.version;
const IMAGE_INLINE_SIZE_LIMIT = parseInt(IMAGE_INLINE_SIZE_LIMIT_ENV);

const MODULE_FILE_EXTENSIONS = ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'];
const ADDITIONAL_MODULE_PATHS = [
  tsConfig.compilerOptions.baseUrl && path.join(PATHS.CWD, tsConfig.compilerOptions.baseUrl)
].filter(Boolean);
const CSS_REGEX = /\.css$/;
const CSS_MODULE_REGEX = /\.module\.css$/;

export const buildBaseConfig = (): WebPack.Configuration & Pick<WebPack.WebpackOptionsNormalized, 'devServer'> => ({
  mode: WEBPACK_MODE,
  bail: PRODUCTION_ENV,
  /** Will pick-up on `.browserslistrc` */
  target: 'browserslist',
  devtool: SOURCE_MAP && 'inline-cheap-module-source-map',

  output: {
    path: PATHS.OUTPUT,
    pathinfo: DEVELOPMENT_ENV ? 'verbose' : false,
    /* For `rule.type = 'asset' | 'asset/resource'` */
    assetModuleFilename: 'media/[hash:8][ext]'
  },

  resolve: {
    modules: [PATHS.NODE_MODULES, ...ADDITIONAL_MODULE_PATHS],
    extensions: MODULE_FILE_EXTENSIONS,

    /*
      Some libraries import Node modules but don't use them in the browser.
      Tell Webpack to provide mocks for them so importing them works.
    */
    fallback: {
      fs: false,
      path: require.resolve('path-browserify'),
      buffer: require.resolve('buffer'),
      stream: require.resolve('stream-browserify'),
      crypto: require.resolve('crypto-browserify'),
      util: require.resolve('util/'),
      assert: require.resolve('assert/'),
      vm: require.resolve('vm-browserify'),
      /* Current package version has a bug with false import path */
      '@ledgerhq/devices/hid-framing': require.resolve('@ledgerhq/devices/lib-es/hid-framing')
    },

    alias: {
      /*
        Exports of `punycode@2.3.0/punycode.js` & `punycode@2.3.0/punycode.es6.js` are different.
        We need the former ones (e.g. `idna-uts46-hx` relies on it).
      */
      punycode$: require.resolve('punycode/punycode.js')
    }
  },

  module: {
    strictExportPresence: true,

    rules: [
      {
        // "oneOf" will traverse all following loaders until one will
        // match the requirements. When no loader matches it will fall
        // back to the "file" loader at the end of the loader list.
        oneOf: [
          // "url" loader works like "file" loader except that it embeds assets
          // smaller than specified limit in bytes as data URLs to avoid requests.
          // A missing `test` is equivalent to a match.
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: IMAGE_INLINE_SIZE_LIMIT
              }
            }
          },
          // # SVGs. See: https://react-svgr.com/docs/webpack
          {
            test: /\.svg$/i,
            type: 'asset/resource',
            resourceQuery: /url/ // *.svg?url
          },
          {
            test: /\.svg$/i,
            issuer: /\.tsx?$/,
            resourceQuery: { not: /url/ }, // exclude react component if *.svg?url
            use: [
              {
                loader: require.resolve('@svgr/webpack'),
                options: svgrLoaderOptions
              }
            ]
          },
          {
            test: /\.(ts|mts|cts|tsx)$/,
            loader: require.resolve('ts-loader'),
            options: {
              transpileOnly: true,
              compilerOptions: {
                target: 'ESNext',
                removeComments: PRODUCTION_ENV,
                sourceMap: SOURCE_MAP
              }
            }
          },
          // "postcss" loader applies autoprefixer to our CSS.
          // "css" loader resolves paths in CSS and adds assets as dependencies.
          // "style" loader turns CSS into JS modules that inject <style> tags.
          // In production, we use MiniCSSExtractPlugin to extract that CSS
          // to a file, but in development "style" loader enables hot editing
          // of CSS.
          // By default we support CSS Modules with the extension .module.css
          {
            test: CSS_REGEX,
            exclude: CSS_MODULE_REGEX,
            use: getStyleLoaders(),
            // Don't consider CSS imports dead code even if the
            // containing package claims to have no side effects.
            // Remove this when webpack adds a warning or an error for this.
            // See https://github.com/webpack/webpack/issues/6571
            sideEffects: true
          },
          // Adds support for CSS Modules (https://github.com/css-modules/css-modules)
          // using the extension .module.css
          {
            test: CSS_MODULE_REGEX,
            use: getStyleLoaders(true)
          },
          // "file" loader makes sure those assets get served by WebpackDevServer.
          // When you `import` an asset, you get its (virtual) filename.
          // In production, they would get copied to the `build` folder.
          // This loader doesn't use a "test" so it will catch all modules
          // that fall through the other loaders.
          {
            type: 'asset/resource',
            // Exclude `js` files to keep "css" loader working as it injects
            // its runtime that would otherwise be processed through "file" loader.
            // Also exclude `html` and `json` extensions so they get processed
            // by webpacks internal loaders & `svg` extensions to be processed (as assets) differently (above).
            exclude: [/\.(js|mjs|cjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/, /\.svg$/]
          }
          // ** STOP ** Are you adding a new loader?
          // Make sure to add the new loader(s) before the "file" loader.
        ]
      }
    ]
  },

  plugins: [
    /*
      Some dependencies do not perform checks on `typeof nodeSpecificAsset !== undefined`.
      WebPack v4 injected `nodeSpecificAsset` automatically.
    */
    new WebPack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
      // Seen 'setImmediate' in: 'scryptsy'
      setImmediate: ['timers-browserify', 'setImmediate']
    }),

    new WebPack.IgnorePlugin({
      resourceRegExp: /^\.\/wordlists\/(?!english)/,
      contextRegExp: /bip39\/src$/
    }),
    IS_CORE_BUILD &&
      new WebPack.IgnorePlugin({
        resourceRegExp: /^@temple-wallet\/extension-ads(\/.+)?$/
      }),

    new ModuleNotFoundPlugin(PATHS.SOURCE),

    new WebPack.DefinePlugin({
      SharedArrayBuffer: '_SharedArrayBuffer',
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      'process.env.VERSION': JSON.stringify(VERSION),
      'process.env.MANIFEST_VERSION': JSON.stringify(String(MANIFEST_VERSION)),
      'process.env.BACKGROUND_IS_WORKER': JSON.stringify(String(BACKGROUND_IS_WORKER)),
      'process.env.TARGET_BROWSER': JSON.stringify(TARGET_BROWSER),
      ...Object.fromEntries(
        Object.entries(envFilesData).map(([name, value]) => {
          const key = `process.env.${name}`;
          return [key, JSON.stringify(value)];
        })
      )
    }),

    new ForkTsCheckerWebpackPlugin({
      async: DEVELOPMENT_ENV,
      typescript: {
        typescriptPath: resolve.sync('typescript', {
          basedir: PATHS.NODE_MODULES
        }),
        configOverwrite: {
          compilerOptions: {
            sourceMap: DEVELOPMENT_ENV,
            skipLibCheck: true,
            inlineSourceMap: false,
            declarationMap: false,
            noEmit: true,
            incremental: true,
            tsBuildInfoFile: false
          }
        },
        // context: paths.appPath,
        diagnosticOptions: {
          syntactic: true
        },
        mode: 'write-references'
        // profile: true
      },
      issue: {
        // This one is specifically to match during CI tests,
        // as micromatch doesn't match
        // '../cra-template-typescript/template/src/App.tsx'
        // otherwise.
        include: [{ file: '../**/src/**/*.{ts,tsx}' }, { file: '**/src/**/*.{ts,tsx}' }],
        exclude: [
          { file: '**/src/**/__tests__/**' },
          { file: '**/src/**/?(*.){spec|test}.*' },
          { file: '**/src/setupProxy.*' },
          { file: '**/src/setupTests.*' }
        ]
      }
    }),

    new ESLintPlugin({
      extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
      formatter: require.resolve('react-dev-utils/eslintFormatter'),
      eslintPath: require.resolve('eslint'),
      resolvePluginsRelativeTo: PATHS.CWD,
      cache: DEVELOPMENT_ENV,
      cacheLocation: path.resolve(PATHS.NODE_MODULES, '.cache/.eslintcache'),
      lintDirtyModulesOnly: DEVELOPMENT_ENV,
      failOnError: true,
      quiet: true
    })
  ].filter(Boolean),

  optimization: {
    minimize: PRODUCTION_ENV,

    minimizer: [
      // This is only used in production mode
      new TerserPlugin({
        terserOptions: {
          sourceMap: SOURCE_MAP,
          parse: {
            /*
              We want terser to parse ecma 8 code. However, we don't want it
              to apply any minification steps that turns valid ecma 5 code
              into invalid ecma 5 code. This is why the 'compress' and 'output'
              sections only apply transformations that are ecma 5 safe
              https://github.com/facebook/create-react-app/pull/4234
            */
            ecma: 2017 // ES8
          },
          compress: {
            ecma: 2017,
            /*
              Disabled because of an issue with Uglify breaking seemingly valid code:
              https://github.com/facebook/create-react-app/issues/2376
              Pending further investigation:
              https://github.com/mishoo/UglifyJS2/issues/2011
            */
            comparisons: false,
            /*
              Disabled because of an issue with Terser breaking valid code:
              https://github.com/facebook/create-react-app/issues/5250
              Pending further investigation:
              https://github.com/terser-js/terser/issues/120
            */
            inline: 2,
            drop_console: DROP_CONSOLE_IN_PROD && PRODUCTION_ENV
          },
          // mangle: {
          //   safari10: true
          // },
          keep_classnames: false,
          keep_fnames: false,
          output: {
            ecma: 2017,
            comments: false,
            /*
              Turned on because emoji and regex is not minified properly using default
              https://github.com/facebook/create-react-app/issues/2488
            */
            ascii_only: true
          }
        }
      })
    ]
  },

  // Turn off performance processing because we utilize
  // our own hints via the FileSizeReporter
  performance: false
});

function getStyleLoaders(module = false) {
  const extraCssOptions = module
    ? {
        modules: {
          namedExport: false,
          exportLocalsConvention: 'as-is',
          getLocalIdent: getCSSModuleLocalIdent
        }
      }
    : undefined;

  return [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        publicPath: '../'
      }
    },
    {
      loader: require.resolve('css-loader'),
      options: {
        importLoaders: 1,
        sourceMap: SOURCE_MAP,
        ...extraCssOptions
      }
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        sourceMap: SOURCE_MAP,
        postcssOptions: {
          ident: 'postcss',
          plugins: [
            require('postcss-flexbugs-fixes'),
            postcssPresetEnv({
              autoprefixer: {},
              stage: 3
            }),
            require('tailwindcss'),
            require('autoprefixer')
          ]
        }
      }
    }
  ].filter(Boolean);
}

/** See: https://react-svgr.com/docs/options */
const svgrLoaderOptions: SvgrLoaderOptions = {
  typescript: true,
  exportType: 'named',
  prettier: false,
  svgo: false,
  titleProp: true,
  ref: true,
  memo: true
};
