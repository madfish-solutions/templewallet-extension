"use strict";

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const webpack = require("webpack");
const wextManifest = require("wext-manifest");
const ZipPlugin = require("zip-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
// const ExtensionReloader = require("webpack-extension-reloader");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const WebpackBar = require("webpackbar");
const safePostCssParser = require("postcss-safe-parser");
const tsConfig = require("./tsconfig.json");

// Steal ENV vars from .env file
dotenv.config();

// Grab NODE_ENV and THANOS_WALLET_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
const THANOS_WALLET = /^THANOS_WALLET_/i;
const {
  NODE_ENV = "development",
  TARGET_BROWSER = "chrome",
  SOURCE_MAP: SOURCE_MAP_ENV
} = process.env;
const SOURCE_MAP = NODE_ENV !== "production" && SOURCE_MAP_ENV !== "false";
const CWD_PATH = fs.realpathSync(process.cwd());
const SOURCE_PATH = path.join(CWD_PATH, "src");
const PUBLIC_PATH = path.join(CWD_PATH, "public");
const DEST_PATH = path.join(CWD_PATH, "dist");
const OUTPUT_PATH = path.join(DEST_PATH, `${TARGET_BROWSER}_unpacked`);
const PACKED_EXTENSION = (() => {
  switch (TARGET_BROWSER) {
    case "opera":
      return "crx";

    case "firefox":
      return "xpi";

    default:
      return "zip";
  }
})();
const OUTPUT_PACKED_PATH = path.join(
  OUTPUT_PATH,
  `${TARGET_BROWSER}.${PACKED_EXTENSION}`
);
const HTML_TEMPLATES = [
  {
    path: path.join(PUBLIC_PATH, "popup.html"),
    chunks: ["popup"]
  },
  {
    path: path.join(PUBLIC_PATH, "welcome.html"),
    chunks: ["welcome"]
  },
  {
    path: path.join(PUBLIC_PATH, "options.html"),
    chunks: ["options"]
  }
];
const ENTRIES = {
  popup: path.join(SOURCE_PATH, "popup.tsx"),
  welcome: path.join(SOURCE_PATH, "welcome.tsx"),
  options: path.join(SOURCE_PATH, "options.tsx"),
  background: path.join(SOURCE_PATH, "background.ts")
};
const SEPARATED_CHUNKS = new Set(["background"]);
const MANIFEST_PATH = path.join(PUBLIC_PATH, "manifest.json");
const MODULE_FILE_EXTENSIONS = [".js", ".mjs", ".jsx", ".ts", ".tsx", ".json"];
const ADDITIONAL_MODULE_PATHS = [
  tsConfig.compilerOptions.baseUrl &&
    path.join(CWD_PATH, tsConfig.compilerOptions.baseUrl)
].filter(Boolean);
const CSS_REGEX = /\.css$/;
const CSS_MODULE_REGEX = /\.module\.css$/;
const PURGECSS_OPTIONS = {
  content: ["./public/**/*.{html,js,mjs}", "./src/**/*.{js,jsx,ts,tsx}"],
  // Include any special characters you're using in this regular expression
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
};

module.exports = {
  mode: NODE_ENV,
  bail: NODE_ENV === "production",
  devtool: SOURCE_MAP && "cheap-module-source-map",

  entry: ENTRIES,

  output: {
    path: OUTPUT_PATH,
    pathinfo: NODE_ENV === "development",
    filename: "[name].js",
    chunkFilename: "[name].chunk.js"
  },

  resolve: {
    modules: ["node_modules", ...ADDITIONAL_MODULE_PATHS],
    extensions: MODULE_FILE_EXTENSIONS
  },

  module: {
    strictExportPresence: true,

    rules: [
      { parser: { requireEnsure: false } },

      // First, run the linter.
      // It's important to do this before Babel processes the JS.
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        enforce: "pre",
        include: SOURCE_PATH,
        use: [
          {
            options: {
              cache: true,
              formatter: require.resolve("react-dev-utils/eslintFormatter"),
              eslintPath: require.resolve("eslint"),
              resolvePluginsRelativeTo: __dirname,
              ignore: process.env.EXTEND_ESLINT === "true",
              baseConfig: (() => {
                // We allow overriding the config only if the env variable is set
                if (process.env.EXTEND_ESLINT === "true") {
                  const eslintCli = new eslint.CLIEngine();
                  let eslintConfig;
                  try {
                    eslintConfig = eslintCli.getConfigForFile(paths.appIndexJs);
                  } catch (e) {
                    console.error(e);
                    process.exit(1);
                  }
                  return eslintConfig;
                } else {
                  return {
                    extends: [require.resolve("eslint-config-react-app")]
                  };
                }
              })(),
              useEslintrc: false
            },
            loader: require.resolve("eslint-loader")
          }
        ]
      },

      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        loader: "@sucrase/webpack-loader",
        include: SOURCE_PATH,
        options: {
          transforms: ["typescript", "jsx"],
          production: NODE_ENV === "production"
        }
      },
      {
        test: CSS_REGEX,
        exclude: CSS_MODULE_REGEX,
        use: getStyleLoaders({
          importLoaders: 1,
          sourceMap: SOURCE_MAP
        })
      }
      // {
      //   test: CSS_MODULE_REGEX,
      //   use: getStyleLoaders({
      //     importLoaders: 1,
      //     // sourceMap: isEnvProduction && shouldUseSourceMap,
      //     modules: {
      //       getLocalIdent: getCSSModuleLocalIdent,
      //     },
      //   }),
      // },
    ]
  },

  plugins: [
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify(NODE_ENV),
      "process.env.TARGET_BROWSER": JSON.stringify(TARGET_BROWSER),
      ...(() => {
        const appEnvs = {};
        for (const k of Object.keys(process.env)) {
          if (THANOS_WALLET.test(k)) {
            appEnvs[`process.env.${k}`] = JSON.stringify(process.env[k]);
          }
        }
        return appEnvs;
      })()
    }),

    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [OUTPUT_PATH, OUTPUT_PACKED_PATH],
      cleanStaleWebpackAssets: false,
      verbose: false
    }),

    ...HTML_TEMPLATES.map(
      htmlTemplate =>
        new HtmlWebpackPlugin({
          template: htmlTemplate.path,
          filename: path.basename(htmlTemplate.path),
          chunks: [...htmlTemplate.chunks, "commons"],
          inject: "body"
        })
    ),

    new MiniCssExtractPlugin({
      filename: "[name].css",
      chunkFilename: "[name].chunk.css"
    }),

    new CopyWebpackPlugin([
      {
        from: PUBLIC_PATH,
        to: OUTPUT_PATH
      },
      {
        from: MANIFEST_PATH,
        to: path.join(OUTPUT_PATH, "manifest.json"),
        toType: "file",
        transform: content =>
          wextManifest[TARGET_BROWSER](JSON.parse(content)).content
      }
    ]),

    // plugin to enable browser reloading in development mode
    //   NODE_ENV === "development" && new ExtensionReloader({
    //     port: 9090,
    //     reloadPage: true,
    //     entries: {
    //         // TODO: reload manifest on update
    //         contentScript: 'contentScript',
    //         background: 'background',
    //         extensionPage: ['popup', 'options'],
    //     },
    // }),

    new WebpackBar()
  ].filter(Boolean),

  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: "commons",
          minChunks: 2,
          chunks(chunk) {
            return !SEPARATED_CHUNKS.has(chunk.name);
          }
        }
      }
    },

    minimizer: [
      new TerserPlugin({
        sourceMap: SOURCE_MAP,
        terserOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            comparisons: false,
            inline: 2
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
      }),

      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          parser: safePostCssParser,
          map: SOURCE_MAP
            ? {
                // `inline: false` forces the sourcemap to be output into a
                // separate file
                inline: false,
                // `annotation: true` appends the sourceMappingURL to the end of
                // the css file, helping the browser find the sourcemap
                annotation: true
              }
            : false
        },
        cssProcessorPluginOptions: {
          preset: ["default", { minifyFontValues: { removeQuotes: false } }]
        }
      }),

      new ZipPlugin({
        path: DEST_PATH,
        extension: PACKED_EXTENSION,
        filename: TARGET_BROWSER
      })
    ]
  },

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    module: "empty",
    dgram: "empty",
    dns: "mock",
    fs: "empty",
    http2: "empty",
    net: "empty",
    tls: "empty",
    child_process: "empty"
  },
  // Turn off performance processing because we utilize
  // our own hints via the FileSizeReporter
  performance: false
};

function getStyleLoaders(cssOptions = {}) {
  return [
    {
      loader: MiniCssExtractPlugin.loader
    },
    {
      loader: require.resolve("css-loader"),
      options: cssOptions
    },
    {
      loader: require.resolve("postcss-loader"),
      options: {
        ident: "postcss",
        plugins: () =>
          [
            require("postcss-flexbugs-fixes"),
            require("postcss-preset-env")({
              autoprefixer: {
                flexbox: "no-2009"
              },
              stage: 3
            }),
            require("tailwindcss"),
            NODE_ENV === "production" &&
              require("@fullhuman/postcss-purgecss")(PURGECSS_OPTIONS),
            require("autoprefixer")
          ].filter(Boolean),
        sourceMap: SOURCE_MAP
      }
    }
  ].filter(Boolean);
}
