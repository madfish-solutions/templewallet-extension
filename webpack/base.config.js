/*
  Reference for this config:
  https://github.com/facebook/create-react-app/blob/main/packages/react-scripts/config/webpack.config.js
*/

const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');
const ForkTsCheckerWebpackPlugin = require('react-dev-utils/ForkTsCheckerWebpackPlugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');
const typescriptFormatter = require('react-dev-utils/typescriptFormatter');
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const resolve = require('resolve');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

const pkg = require('../package.json');
const tsConfig = require('../tsconfig.json');
const {
  NODE_ENV,
  TARGET_BROWSER,
  SOURCE_MAP_ENV,
  IMAGE_INLINE_SIZE_LIMIT_ENV,
  CWD_PATH,
  NODE_MODULES_PATH,
  SOURCE_PATH,
  OUTPUT_PATH
} = require('./consts');

require('./cleanup');

// Grab NODE_ENV and TEMPLE_WALLET_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
const TEMPLE_WALLET = /^TEMPLE_WALLET_/i;

const VERSION = pkg.version;
const SOURCE_MAP = NODE_ENV !== 'production' && SOURCE_MAP_ENV !== 'false';
const IMAGE_INLINE_SIZE_LIMIT = parseInt(IMAGE_INLINE_SIZE_LIMIT_ENV);

const MODULE_FILE_EXTENSIONS = ['.js', '.mjs', '.jsx', '.ts', '.tsx', '.json'];
const ADDITIONAL_MODULE_PATHS = [
  tsConfig.compilerOptions.baseUrl && path.join(CWD_PATH, tsConfig.compilerOptions.baseUrl)
].filter(Boolean);
const CSS_REGEX = /\.css$/;
const CSS_MODULE_REGEX = /\.module\.css$/;

module.exports.buildBaseConfig = () => ({
  mode: NODE_ENV,
  bail: NODE_ENV === 'production',
  devtool: SOURCE_MAP && 'inline-cheap-module-source-map',

  output: {
    path: OUTPUT_PATH,
    pathinfo: NODE_ENV === 'development' ? 'verbose' : false,
    filename: 'scripts/[name].js',
    /* Not working like in WP4 `optimization.splitChunks.cacheGroups.{cacheGroupKey}.name` overrides this. */
    chunkFilename: 'scripts/[name].chunk.js',
    /* For `rule.type = 'asset' | 'asset/resource'` */
    assetModuleFilename: 'media/[hash:8][ext]'
  },

  resolve: {
    modules: [NODE_MODULES_PATH, ...ADDITIONAL_MODULE_PATHS],
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
      assert: require.resolve('assert/')
    },

    alias: {
      /*
        Exports of `punycode@2.1.1/punycode.js` & `punycode@2.1.1/punycode.es6.js` are different.
        We need the former ones (e.g. `idna-uts46-hx` relies on it).
      */
      punycode$: require.resolve('punycode/punycode.js')
    },

    plugins: [
      {
        apply(resolver) {
          const target = resolver.ensureHook('resolve');

          resolver.getHook('resolve').tapAsync('TaquitoSignerResolverPlugin', (request, resolveContext, callback) => {
            if (/@taquito\/signer$/.test(request.request) && /@taquito\/taquito/.test(request.context.issuer)) {
              return resolver.doResolve(
                target,
                {
                  ...request,
                  request: 'lib/taquito-signer-stub'
                },
                null,
                resolveContext,
                callback
              );
            }

            callback();
          });
        }
      }
    ]
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
          {
            test: /\.svg$/,
            issuer: {
              and: [/\.(ts|tsx|js|jsx|md|mdx)$/]
            },
            use: [
              {
                loader: require.resolve('@svgr/webpack'),
                options: {
                  prettier: false,
                  svgo: false,
                  svgoConfig: {
                    plugins: [{ removeViewBox: false }]
                  },
                  titleProp: true,
                  ref: true
                }
              },
              {
                /* `type: 'asset/resource'` is not applicable here - WebPack bug. Had to go with `file-loader` */
                loader: require.resolve('file-loader'),
                options: {
                  name: 'media/[hash:8].[ext]'
                }
              }
            ]
          },
          // Process application JS with Babel.
          // The preset includes JSX, Flow, TypeScript, and some ESnext features.
          {
            test: /\.(js|mjs|jsx|ts|tsx)$/,
            include: SOURCE_PATH,
            loader: require.resolve('babel-loader'),
            options: {
              customize: require.resolve('babel-preset-react-app/webpack-overrides'),
              // This is a feature of `babel-loader` for webpack (not Babel itself).
              // It enables caching results in ./node_modules/.cache/babel-loader/
              // directory for faster rebuilds.
              cacheDirectory: true,
              // See #6846 for context on why cacheCompression is disabled
              cacheCompression: false,
              compact: NODE_ENV === 'production'
            }
          },
          // Process any JS outside of the app with Babel.
          // Unlike the application JS, we only compile the standard ES features.
          {
            test: /\.(js|mjs)$/,
            exclude: /@babel(?:\/|\\{1,2})runtime/,
            loader: require.resolve('babel-loader'),
            options: {
              babelrc: false,
              configFile: false,
              compact: false,
              presets: [[require.resolve('babel-preset-react-app/dependencies'), { helpers: true }]],
              cacheDirectory: true,
              // See #6846 for context on why cacheCompression is disabled
              cacheCompression: false,
              // Babel sourcemaps are needed for debugging into node_modules
              // code.  Without the options below, debuggers like VSCode
              // show incorrect code and set breakpoints on the wrong lines.
              sourceMaps: SOURCE_MAP,
              inputSourceMap: SOURCE_MAP
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
            use: getStyleLoaders({
              importLoaders: 1,
              sourceMap: SOURCE_MAP
            }),
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
            use: getStyleLoaders({
              importLoaders: 1,
              sourceMap: SOURCE_MAP,
              modules: {
                getLocalIdent: getCSSModuleLocalIdent
              }
            })
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
            // by webpacks internal loaders.
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/]
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
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
      // Seen 'setImmediate' in: 'scryptsy'
      setImmediate: ['timers-browserify', 'setImmediate']
    }),

    new webpack.IgnorePlugin({ resourceRegExp: /^\.\/wordlists\/(?!english)/, contextRegExp: /bip39\/src$/ }),

    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [],
      cleanStaleWebpackAssets: false,
      verbose: false
    }),

    new ModuleNotFoundPlugin(SOURCE_PATH),

    new webpack.DefinePlugin({
      SharedArrayBuffer: '_SharedArrayBuffer',
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
      'process.env.VERSION': JSON.stringify(VERSION),
      'process.env.TARGET_BROWSER': JSON.stringify(TARGET_BROWSER),
      ...(() => {
        const appEnvs = {};
        for (const k of Object.keys(process.env)) {
          if (TEMPLE_WALLET.test(k)) {
            appEnvs[`process.env.${k}`] = JSON.stringify(process.env[k]);
          }
        }
        return appEnvs;
      })()
    }),

    new WatchMissingNodeModulesPlugin(NODE_MODULES_PATH),

    new ForkTsCheckerWebpackPlugin({
      typescript: resolve.sync('typescript', {
        basedir: NODE_MODULES_PATH
      }),
      async: false,
      silent: true,
      useTypescriptIncrementalApi: true,
      checkSyntacticErrors: true,
      tsconfig: path.join(CWD_PATH, 'tsconfig.json'),
      reportFiles: ['**', '!**/__tests__/**', '!**/?(*.)(spec|test).*', '!**/src/setupProxy.*', '!**/src/setupTests.*'],
      formatter: typescriptFormatter
    }),

    new ESLintPlugin({
      extensions: ['js', 'mjs', 'jsx', 'ts', 'tsx'],
      formatter: require.resolve('react-dev-utils/eslintFormatter'),
      eslintPath: require.resolve('eslint'),
      resolvePluginsRelativeTo: CWD_PATH,
      cache: true,
      cacheLocation: path.resolve(NODE_MODULES_PATH, '.cache/.eslintcache'),
      failOnError: true
    })
  ].filter(Boolean),

  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          sourceMap: SOURCE_MAP,
          parse: {
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2,
            drop_console: NODE_ENV === 'production'
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 5,
            comments: false,
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

function getStyleLoaders(cssOptions = {}) {
  return [
    {
      loader: MiniCssExtractPlugin.loader,
      options: {
        publicPath: '../'
      }
    },
    {
      loader: require.resolve('css-loader'),
      options: cssOptions
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        postcssOptions: {
          ident: 'postcss',
          plugins: [
            require('postcss-flexbugs-fixes'),
            require('postcss-preset-env')({
              autoprefixer: {
                flexbox: 'no-2009'
              },
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
