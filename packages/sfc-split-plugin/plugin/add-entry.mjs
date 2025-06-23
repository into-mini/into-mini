import { extname } from 'node:path';

import {
  createAddEntry,
  createEmitFile,
  readAndTrack,
} from '../helper/hooks.mjs';
import { getAllPages, patchConfig } from '../helper/index.mjs';

/**
 * Webpack插件，用于处理小程序和插件的入口文件
 */
export class AddEntryPlugin {
  PLUGIN_NAME = 'AddEntryPlugin';

  /**
   * @param {Object} options - 插件配置选项
   * @param {string} [options.type=false] - 项目类型，可选值：'miniprogram'或'plugin'
   */
  constructor({ type = false } = {}) {
    this.type = type;
  }

  /**
   * 处理Vue页面入口
   * @private
   */
  #handleVuePages(params, pages, basePath = '.') {
    const { addEntry, compilation } = params;
    pages.forEach((page) => {
      const source = `${basePath}/${page}.vue`;
      addEntry(page, source);
      compilation.fileDependencies.add(source);
    });
  }

  /**
   * 处理插件页面和组件
   * @private
   */
  #handlePluginSection(params, config, section) {
    const entries = config[section];

    if (!entries) {
      return;
    }

    Object.entries(entries).forEach(([key, path]) => {
      if (typeof path === 'string' && extname(path) === '.vue') {
        const source = `${section}/${key}/index`;
        params.addEntry(source, path);
        params.compilation.fileDependencies.add(path);

        if (section === 'pages') {
          config.pages = config.pages || {};
          config.pages[key] = source;
        }
      }
    });
  }

  /**
   * 处理配置和入口
   * @private
   */
  #processConfig(params, configType) {
    const { readFrom, emitFile, addEntry, compilation } = params;
    const { content: config, name } = readFrom(configType);

    if (configType === 'app') {
      emitFile(name, patchConfig(config));
      this.#handleVuePages(params, getAllPages(config));
    } else if (configType === 'plugin') {
      if (config.main) {
        addEntry('main', config.main);
        compilation.fileDependencies.add(config.main);
        config.main = 'main.js';
      }

      this.#handlePluginSection(params, config, 'pages');
      this.#handlePluginSection(params, config, 'publicComponents');
      emitFile(name, config);
    }
  }

  apply(compiler) {
    const {
      EntryPlugin,
      EntryDependency,
      sources: { RawSource },
    } = compiler.webpack;

    compiler.hooks.compilation.tap(
      this.PLUGIN_NAME,
      (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(
          EntryDependency,
          normalModuleFactory,
        );
      },
    );

    compiler.hooks.thisCompilation.tap(
      this.PLUGIN_NAME,
      (compilation, { normalModuleFactory }) => {
        compilation.dependencyFactories.set(
          EntryDependency,
          normalModuleFactory,
        );
      },
    );

    const addEntry = createAddEntry(compiler, EntryPlugin);

    if (this.type === 'miniprogram') {
      // 设置初始环境
      compiler.hooks.afterEnvironment.tap(this.PLUGIN_NAME, () => {
        delete compiler.options.entry?.main;
        addEntry('app', './app');
      });
    }

    // 处理入口文件和配置
    compiler.hooks.compilation.tap(this.PLUGIN_NAME, (compilation) => {
      const params = {
        compilation,
        addEntry,
        emitFile: createEmitFile({
          PLUGIN_NAME: this.PLUGIN_NAME,
          compilation,
          RawSource,
        }),
        readFrom: readAndTrack(compiler, compilation),
      };

      this.#processConfig(
        params,
        this.type === 'miniprogram' ? 'app' : 'plugin',
      );
    });
  }
}
