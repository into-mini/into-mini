import type {
  Compiler,
  Compilation,
  PathData,
  Module,
  Chunk,
  WebpackPluginInstance, //
} from 'webpack';
import slash from 'slash';

const PLUGIN_NAME = 'ExposeEntryNamePlugin';

export class ExposeEntryNamePlugin implements WebpackPluginInstance {
  getEntryNameFromChunk(chunk: Chunk) {
    if (!chunk?.groupsIterable) {
      return '';
    }

    for (const group of chunk.groupsIterable) {
      if (group.isInitial()) {
        return group.name;
      }
    }

    return '';
  }

  getEntryNameFromEntries(compilation: Compilation, module: Module) {
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

  getEntryNameFromPathData(pathData: PathData) {
    if (pathData?.chunk) {
      const entryName = this.getEntryNameFromChunk(pathData.chunk as Chunk);

      if (entryName) {
        return entryName;
      }
    }

    if (pathData?.module && pathData?.chunkGraph) {
      const chunks = pathData.chunkGraph.getModuleChunks(
        pathData.module as Module,
      );

      for (const chunk of chunks) {
        const entryName = this.getEntryNameFromChunk(chunk);

        if (entryName) {
          return entryName;
        }
      }
    }

    return '';
  }

  apply(compiler: Compiler) {
    const {
      NormalModule: { getCompilationHooks },
    } = compiler.webpack;

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.assetPath.tap(PLUGIN_NAME, (path, pathData) => {
        if (path.includes('[entry]')) {
          const entryName = this.getEntryNameFromPathData(pathData);

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
