import * as glob from 'glob';
import { Compiler, WebpackError } from 'webpack';

export class CheckUnusedImportsPlugin {
  constructor(private patterns: string[], private failOnUnused: boolean) {
    //
  }

  apply(compiler: Compiler) {
    compiler.hooks.done.tap('CheckUnusedImportsPlugin', stats => {
      const toBeChecked = this.patterns.map(p => glob.sync(p, { absolute: true })).flat();

      const allImports = new Set(stats.compilation.fileDependencies);

      const notUsed = toBeChecked.filter(src => !allImports.has(src));

      if (notUsed.length > 0) {
        const errorMessage = 'Unused imports:\n' + notUsed.join('\n');

        if (this.failOnUnused) throw new Error(errorMessage);

        stats.compilation.errors.push(new WebpackError(errorMessage));
      }
    });
  }
}
