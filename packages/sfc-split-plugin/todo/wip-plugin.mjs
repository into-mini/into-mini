import { ExposeEntryNamePlugin } from '../plugin/expose-entry.mjs';

/**
 * PatchLoaderPlugin - 用于根据入口名称修改模块的 loaders
 *
 * 这个插件允许你为特定的入口点定义处理函数，
 * 这些函数可以修改或删除与该入口点相关联的模块的 loaders。
 */
export class PatchLoaderPlugin extends ExposeEntryNamePlugin {
  PLUGIN_NAME = 'PatchLoaderPlugin';

  entryConfigs = {};

  /**
   * @param {Object} options - 格式为 {[entryName]: useFunction}
   * useFunction 接收 (loaders, module, compilation) 参数并返回修改后的 loaders 数组
   */
  constructor(options = {}) {
    super();

    // 只保留值为函数的条目
    Object.entries(options).forEach(([entry, use]) => {
      if (typeof use === 'function') {
        this.entryConfigs[entry] = use;
      }
    });
  }

  /**
   * 应用插件到webpack编译器
   * @param {Object} compiler - webpack 编译器实例
   */
  apply(compiler) {
    super.apply(compiler);

    // 如果没有有效配置，则不处理
    if (Object.keys(this.entryConfigs).length === 0) {
      return;
    }

    // 从webpack获取NormalModule
    const {
      NormalModule: { getCompilationHooks },
    } = compiler.webpack;

    compiler.hooks.compilation.tap(this.PLUGIN_NAME, (compilation) => {
      getCompilationHooks(compilation).beforeLoaders.tap(
        this.PLUGIN_NAME,
        (loaders, module) => this.handleModule(loaders, module, compilation),
      );
    });
  }

  handleModule(loaders, module, compilation) {
    const entryName = this.findMatchingEntry(module, compilation);

    const useFunction = entryName ? this.entryConfigs[entryName] : undefined;

    if (!useFunction) {
      return;
    }

    const result = useFunction(loaders, module, compilation);

    loaders.splice(0, loaders.length, ...result);
  }

  /**
   * 查找模块所属的entry是否在配置中
   * @param {Object} module - webpack模块对象
   * @param {Object} compilation - webpack编译实例
   * @returns {string|null} 匹配的entry名称或null
   */
  findMatchingEntry(module, compilation) {
    const entryName = super.getEntryNameFromCompilation({
      module,
      compilation,
    });

    return entryName && entryName in this.entryConfigs ? entryName : null;
  }
}
