import * as Path from "path";
import nodeResolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import replace from "rollup-plugin-replace";
import sucrase from "rollup-plugin-sucrase";
import alias from "rollup-plugin-alias";
import includePaths from "rollup-plugin-includepaths";
import { terser } from "rollup-plugin-terser";
import tsConfig from "./tsconfig.json";

const { NODE_ENV } = process.env;
const PREACT_COMPAT = NODE_ENV === "production";
const OMITTED_ROLLUP_WARNINGS = new Set(["CIRCULAR_DEPENDENCY"]);
const EXTENSIONS = [".js", ".jsx", ".ts", ".tsx"];
const MODULES_WITH_NAMED_EXPORTS = [
  "react",
  "react-dom",
  "react-is",
  "jdenticon"
];
const ALREADY_TRANSPILED_MODULES = [
  "react",
  "react-dom",
  "react-router-dom",
  "jdenticon"
];

export default {
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
          replacement: require.resolve("preact/compat/src")
        },
        PREACT_COMPAT && {
          find: "react-dom",
          replacement: require.resolve("preact/compat/src")
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
    sucrase({
      transforms: ["typescript", "jsx"],
      production: NODE_ENV === "production",
      exclude: ALREADY_TRANSPILED_MODULES.map(mn =>
        Path.join("node_modules", mn, "**")
      )
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
    NODE_ENV === "production" && terser({ module: true })
  ],
  context: "'undefined'",
  moduleContext: "'undefined'",
  watch: {
    clearScreen: false
  },
  onwarn(warning, rollupWarn) {
    if (!OMITTED_ROLLUP_WARNINGS.has(warning.code)) {
      rollupWarn(warning);
    }
  }
};
