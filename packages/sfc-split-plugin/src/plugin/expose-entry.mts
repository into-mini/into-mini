import type {
  Compiler,
  PathData,
  Module,
  Chunk,
  WebpackPluginInstance,
} from 'webpack';

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
    });
  }
}
