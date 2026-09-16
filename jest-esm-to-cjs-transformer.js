const babel = require('@babel/core');

/**
 * Jest 27 loads modules via CJS. Packages such as `multiformats` ship ESM-only
 * (`"exports": { "import": ... }`), so we transpile them to CommonJS here.
 */
module.exports = {
  process(sourceText, sourcePath) {
    const result = babel.transformSync(sourceText, {
      filename: sourcePath,
      babelrc: false,
      configFile: false,
      compact: false,
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            modules: 'commonjs',
            targets: { node: 'current' }
          }
        ]
      ]
    });

    return result?.code ?? sourceText;
  }
};
