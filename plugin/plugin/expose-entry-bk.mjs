import slash from 'slash';

const PLUGIN_NAME = 'ExposeEntryNamePlugin';

export class ExposeEntryNamePlugin {
  getEntryNameFromEntries(compilation, module) {
    const { moduleGraph, entries } = compilation;

    for (const [name, io] of entries) {
      for (const dep of io.dependencies) {
        const entryModule = moduleGraph.getModule(dep);

        if (entryModule) {
          if (
            // @ts-expect-error ------------
            entryModule.request && // @ts-expect-error ------------
            slash(entryModule.request) === slash(module.request)
          ) {
            return name;
          }

          if (
            // @ts-expect-error ------------
            entryModule?.resource && // @ts-expect-error ------------
            slash(entryModule?.resource) === slash(module.resource)
          ) {
            return name;
          }
        }
      }
    }

    return '';
  }

  getEntryNameFromPathData(compilation, pathData) {
    const mod = pathData.module;
    const graph = pathData.chunkGraph;

    if (mod && graph) {
      const [entryModule] = graph
        .getModuleChunks(mod)
        .map((chunk) => [...graph.getChunkEntryModulesIterable(chunk)][0]);

      if (entryModule) {
        return this.getEntryNameFromEntries(compilation, entryModule);
      }
    }

    return '';
  }

  apply(compiler) {
    const {
      NormalModule: { getCompilationHooks },
    } = compiler.webpack;
    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.assetPath.tap(PLUGIN_NAME, (path, pathData) => {
        if (path.includes('[entry]')) {
          const entryName = this.getEntryNameFromPathData(
            compilation,
            pathData,
          );

          return entryName
            ? path.replaceAll('[entry]', entryName)
            : path.replaceAll('[entry]', '[hash:8]');
        }

        return path;
      });
      getCompilationHooks(compilation).loader.tap(
        PLUGIN_NAME,
        (loaderContext, module) => {
          Object.defineProperty(loaderContext, 'entryName', {
            enumerable: true,
            configurable: false,
            get: () => {
              return this.getEntryNameFromEntries(compilation, module);
            },
          });
        },
      );
    });
  }
}
