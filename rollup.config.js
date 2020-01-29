import * as Fs from "fs";
import * as Path from "path";
import dotenv from "dotenv";
import json from "@rollup/plugin-json";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import alias from "@rollup/plugin-alias";
import includePaths from "rollup-plugin-includepaths";
import sucrase from "@rollup/plugin-sucrase";
import babel from "rollup-plugin-babel";
import { terser } from "rollup-plugin-terser";
import OMT from "@surma/rollup-plugin-off-main-thread";
import tsConfig from "./tsconfig.json";

// Steal ENV vars from .env file
dotenv.config();

// Grab NODE_ENV and THANOS_WALLET_* environment variables and prepare them to be
// injected into the application via DefinePlugin in Webpack configuration.
const THANOS_WALLET = /^THANOS_WALLET_/i;
const { NODE_ENV, PREACT_COMPAT: PREACT_COMPAT_ENV } = process.env;
const PREACT_COMPAT = PREACT_COMPAT_ENV === "true";
const OMITTED_ROLLUP_WARNINGS = new Set(["CIRCULAR_DEPENDENCY", "EVAL"]);
const EXTENSIONS = [".js", ".mjs", ".jsx", ".ts", ".tsx"];
const MODULES_WITH_NAMED_EXPORTS = ["react", "react-dom", "react-is"];
const NON_TRANSPILED_MODULES = ["preact", "swr"];
const JS_MODULES_TRANSPILE_INCLUDE = [
  "ts/**",
  ...NON_TRANSPILED_MODULES.map(mn => Path.join("node_modules", mn, "**"))
];
const OMT_LOADER = Fs.readFileSync(
  Path.join(__dirname, "omt-loader.ejs")
).toString("utf8");
const TAQUITO_SOURCE = "@taquito/taquito";
const TAQUITO_REPLACEMENT = "@taquito/taquito/dist/taquito.bundle.js";

export default {
  output: {
    format: "amd",
    chunkFileNames: "[hash].js"
  },
  plugins: [
    includePaths({
      extensions: EXTENSIONS,
      paths: [tsConfig.compilerOptions.baseUrl],
      external: []
    }),
    alias({
      resolve: EXTENSIONS,
      entries: [
        {
          find: TAQUITO_SOURCE,
          replacement: TAQUITO_REPLACEMENT
        },
        // Preact
        PREACT_COMPAT && {
          find: "react",
          replacement: "preact/compat"
        },
        PREACT_COMPAT && {
          find: "react-dom",
          replacement: "preact/compat"
        }
      ].filter(Boolean)
    }),
    replace({
      "process.env.NODE_ENV": JSON.stringify(NODE_ENV),
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
    json(),
    nodeResolve({
      extensions: EXTENSIONS,
      mainFields: ["source", "module", "main"],
      browser: true,
      preferBuiltins: false
    }),
    NODE_ENV === "production"
      ? babel({
          include: JS_MODULES_TRANSPILE_INCLUDE,
          extensions: EXTENSIONS,
          runtimeHelpers: true
        })
      : sucrase({
          include: JS_MODULES_TRANSPILE_INCLUDE,
          transforms: ["typescript", "jsx"],
          production: NODE_ENV === "production"
        }),
    commonjs({
      include: "node_modules/**",
      namedExports: {
        [TAQUITO_REPLACEMENT]: Object.keys(require(TAQUITO_SOURCE)),
        ...MODULES_WITH_NAMED_EXPORTS.reduce(
          (exps, name) => ({
            ...exps,
            [require.resolve(name)]: Object.keys(require(name))
          }),
          {}
        )
      }
    }),
    OMT({
      loader: OMT_LOADER,
      publicPath: "scripts"
    }),
    NODE_ENV === "production" &&
      terser({
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
      })
  ],
  context: "'undefined'",
  watch: {
    clearScreen: false
  },
  onwarn(warning, rollupWarn) {
    if (!OMITTED_ROLLUP_WARNINGS.has(warning.code)) {
      rollupWarn(warning);
    }
  }
};
