import * as Fs from "fs";
import * as Path from "path";
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

const { NODE_ENV, PREACT_COMPAT: PREACT_COMPAT_ENV } = process.env;
const PREACT_COMPAT = PREACT_COMPAT_ENV === "true";
const OMITTED_ROLLUP_WARNINGS = new Set(["CIRCULAR_DEPENDENCY"]);
const EXTENSIONS = [".js", ".mjs", ".jsx", ".ts", ".tsx"];
const MODULES_WITH_NAMED_EXPORTS = ["react", "react-dom", "react-is"];
const ALREADY_TRANSPILED_MODULES = [
  "react",
  "react-dom",
  "webextension-polyfill-ts",
  "webextension-polyfill"
];
const ALREADY_TRANSPILED_MODULES_EXCLUDE = ALREADY_TRANSPILED_MODULES.map(mn =>
  Path.join("node_modules", mn, "**")
);

export default {
  output: {
    format: "amd",
    chunkFileNames: "[hash].js"
  },
  plugins: [
    includePaths({
      extensions: EXTENSIONS,
      paths: [tsConfig.compilerOptions.baseUrl]
    }),
    alias({
      resolve: EXTENSIONS,
      entries: [
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
      "process.env.NODE_ENV": JSON.stringify(NODE_ENV)
    }),
    nodeResolve({
      mainFields: ["source", "module", "main"],
      extensions: EXTENSIONS,
      browser: true
    }),
    NODE_ENV === "production"
      ? babel({
          exclude: ALREADY_TRANSPILED_MODULES_EXCLUDE,
          extensions: EXTENSIONS,
          runtimeHelpers: true
        })
      : sucrase({
          exclude: ALREADY_TRANSPILED_MODULES_EXCLUDE,
          transforms: ["typescript", "jsx"],
          production: NODE_ENV === "production"
        }),
    commonjs({
      include: "node_modules/**",
      namedExports: MODULES_WITH_NAMED_EXPORTS.reduce(
        (exps, name) => ({
          ...exps,
          [require.resolve(name)]: Object.keys(require(name))
        }),
        {}
      )
    }),
    OMT({
      loader: Fs.readFileSync(Path.join(__dirname, "omt-loader.ejs")).toString(
        "utf8"
      ),
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
