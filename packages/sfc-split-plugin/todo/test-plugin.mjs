export class PatchLoaderPlugin {
  PLUGIN_NAME = 'PatchLoaderPlugin';

  entryConfigs = {};

  /**
   * @param {Object} options - 格式为 {[entryName]: useFunction}
   */
  constructor(options = {}) {
    // 只保留值为函数的条目
    Object.entries(options).forEach(([entry, use]) => {
      if (typeof use === 'function') {
        this.entryConfigs[entry] = use;
      }
    });
  }

  /**
   * 应用插件到webpack编译器
   */
  apply(compiler) {
    // 如果没有有效配置，则不处理
    if (Object.keys(this.entryConfigs).length === 0) {
      return;
    }

    // 从webpack获取NormalModule
    const { NormalModule } = compiler.webpack;

    compiler.hooks.compilation.tap(this.PLUGIN_NAME, (compilation) => {
      NormalModule.getCompilationHooks(compilation).beforeLoaders.tap(
        this.PLUGIN_NAME,
        (loaders, module) => this.processModule(loaders, module, compilation),
      );
    });
  }

  /**
   * 处理模块的loader
   */
  processModule(loaders, module, compilation) {
    // 快速返回条件
    if (!module.resource) {
      return loaders;
    }

    // 查找匹配的entry和对应的use函数
    const entryName = this.findMatchingEntry(module, compilation);

    if (!entryName) {
      return loaders;
    }

    const useFunction = this.entryConfigs[entryName];

    if (!useFunction) {
      return loaders;
    }

    // 应用use函数并验证结果
    const result = useFunction(loaders, module, compilation);

    if (!Array.isArray(result) || result.length === 0) {
      return loaders;
    }

    return result;
  }

  /**
   * 获取模块所属的entry名称
   * @param {Object} module - webpack模块对象
   * @param {Object} compilation - webpack编译实例
   * @returns {string|null} 模块所属的entry名称或''
   */
  getEntryName(module, compilation) {
    const { moduleGraph, entries } = compilation;

    for (const [name, { dependencies }] of entries) {
      for (const dep of dependencies) {
        const entryModule = moduleGraph.getModule(dep);

        if (entryModule?.resource === module.resource) {
          return name;
        }
      }
    }

    return '';
  }

  /**
   * 查找模块所属的entry是否在配置中
   * @param {Object} module - webpack模块对象
   * @param {Object} compilation - webpack编译实例
   * @returns {string|null} 匹配的entry名称或null
   */
  findMatchingEntry(module, compilation) {
    // 获取模块所属的entry名称
    const entryName = this.getEntryName(module, compilation);

    if (!entryName) {
      return null;
    }

    // 检查entry名称是否在配置中
    const configuredEntries = Object.keys(this.entryConfigs);

    if (configuredEntries.includes(entryName)) {
      return entryName;
    }

    return null;
  }
}
