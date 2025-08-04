import { dirname, relative, sep } from 'node:path';

const PLUGIN_NAME = 'MinaRuntimeWebpackPlugin';

export class MinaRuntimeWebpackPlugin {
  // 格式化依赖路径为require语句
  #formatRequire = (from, to) =>
    `require('./${relative(dirname(from), to).split(sep).join('/')}');\n`;

  // 收集并生成所有依赖的require语句
  #generateDependencies = (chunk) => {
    if (!chunk?.name) {
      return '';
    }

    let result = '';

    for (const { chunks } of chunk.groupsIterable) {
      for (const depChunk of chunks) {
        if (depChunk !== chunk && depChunk.name) {
          result += this.#formatRequire(chunk.name, depChunk.name);
        }
      }
    }

    return result;
  };

  apply(compiler) {
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      const {
        javascript: { JavascriptModulesPlugin },
        sources: { ConcatSource },
      } = compiler.webpack;

      JavascriptModulesPlugin.getCompilationHooks(compilation).renderChunk.tap(
        PLUGIN_NAME,
        (source, { chunk }) => {
          if (
            !chunk ||
            !compilation.chunkGraph.getNumberOfEntryModules(chunk)
          ) {
            // 跳过非入口模块
            return source;
          }

          const deps = this.#generateDependencies(chunk);

          if (!deps) {
            return source;
          }

          return new ConcatSource(deps, source);
        },
      );
    });
  }
}
