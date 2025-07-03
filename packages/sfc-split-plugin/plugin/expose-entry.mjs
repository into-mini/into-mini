const PLUGIN_NAME = 'ExposeEntryNamePlugin';

/**
 * 暴露入口名称的Webpack插件
 * 提供统一的方法来获取和使用webpack入口点名称
 */
export class ExposeEntryNamePlugin {
  /**
   * 从chunk获取入口点名称
   * @param {Object} chunk - webpack chunk对象
   * @returns {string} 入口点名称，如果未找到则返回空字符串
   */
  getEntryNameFromChunk(chunk) {
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

  /**
   * 统一的获取entryName方法，可处理不同类型的输入
   * @param {Object} input - 可以是loaderContext或webpack编译数据
   * @returns {string} 入口点名称，如果未找到则返回空字符串
   */
  getEntryName(input) {
    // 处理loader上下文
    if (input?._compilation) {
      return this.getEntryNameFromLoaderContext(input);
    }

    // 处理webpack编译数据
    return this.getEntryNameFromCompilationData(input);
  }

  /**
   * 从loader上下文获取入口点名称
   * @private
   * @param {Object} loaderContext - webpack loader上下文
   * @returns {string} 入口点名称，如果未找到则返回空字符串
   */
  getEntryNameFromLoaderContext(loaderContext) {
    const { moduleGraph, entries } = loaderContext._compilation;

    for (const [name, { dependencies }] of entries) {
      for (const dep of dependencies) {
        const entryModule = moduleGraph.getModule(dep);

        if (entryModule?.resource === loaderContext.resource) {
          return name;
        }
      }
    }

    return '';
  }

  /**
   * 从webpack编译数据获取入口点名称
   * @private
   * @param {Object} data - webpack编译数据
   * @returns {string} 入口点名称，如果未找到则返回空字符串
   */
  getEntryNameFromCompilationData(data) {
    // 1. 直接从chunk获取入口点名称
    if (data?.chunk) {
      const entryName = this.getEntryNameFromChunk(data.chunk);

      if (entryName) {
        return entryName;
      }
    }

    // 2. 从模块的chunks中获取入口点名称
    if (data?.module && data?.chunkGraph) {
      const chunks = data.chunkGraph.getModuleChunks(data.module);

      for (const chunk of chunks) {
        const entryName = this.getEntryNameFromChunk(chunk);

        if (entryName) {
          return entryName;
        }
      }
    }

    return '';
  }

  /**
   * 应用插件到webpack编译器
   * @param {Object} compiler - webpack编译器实例
   */
  apply(compiler) {
    const {
      NormalModule: { getCompilationHooks },
    } = compiler.webpack;

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      // 处理asset路径中的[entry]替换
      compilation.hooks.assetPath.tap(PLUGIN_NAME, (path, data) => {
        if (path.includes('[entry]')) {
          const entryName = this.getEntryName(data);

          return entryName ? path.replaceAll('[entry]', entryName) : path;
        }

        return path;
      });

      // 在loader上下文中暴露entryName
      getCompilationHooks(compilation).loader.tap(
        PLUGIN_NAME,
        (loaderContext) => {
          Object.defineProperty(loaderContext, 'entryName', {
            enumerable: true,
            configurable: false,
            get: () => this.getEntryName(loaderContext),
          });
        },
      );
    });
  }
}
