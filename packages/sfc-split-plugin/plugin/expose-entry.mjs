/**
 * Webpack插件：为loader上下文添加entryName属性
 * 使loader能够知道当前处理的模块属于哪个入口
 */
export class ExposeEntryNamePlugin {
  static PLUGIN_NAME = 'ExposeEntryNamePlugin';

  /**
   * 获取模块所属的入口名称
   * @param {Object} loaderContext Webpack loader上下文
   * @returns {string} 入口名称，如果未找到则返回空字符串
   * @private
   */
  #getEntryName(loaderContext) {
    if (!loaderContext._compilation) {
      return '';
    }

    const { moduleGraph } = loaderContext._compilation;
    let entryName = '';

    for (const [name, { dependencies }] of loaderContext._compilation.entries) {
      for (const dep of dependencies) {
        const entryModule = moduleGraph.getModule(dep);

        if (entryModule && entryModule.resource === loaderContext.resource) {
          entryName = name;
          break;
        }
      }
    }

    return entryName;
  }

  apply(compiler) {
    const { NormalModule } = compiler.webpack;

    compiler.hooks.compilation.tap(
      ExposeEntryNamePlugin.PLUGIN_NAME,
      (compilation) => {
        // 使用loader钩子来扩展loaderContext
        NormalModule.getCompilationHooks(compilation).loader.tap(
          ExposeEntryNamePlugin.PLUGIN_NAME,
          (loaderContext) => {
            // 直接在loaderContext上定义entryName属性
            // 使用getter以便每次访问时都能获取最新值
            Object.defineProperty(loaderContext, 'entryName', {
              enumerable: true,
              get: () => this.#getEntryName(loaderContext),
            });
          },
        );
      },
    );
  }
}
