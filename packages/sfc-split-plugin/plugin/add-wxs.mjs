import { readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import slash from 'slash';

import { createEmitFile } from '../helper/hooks.mjs';
import { CLSX_PLACEHOLDER } from '../helper/index.mjs';

/**
 * 插件名称
 * @type {string}
 */
const PLUGIN_NAME = 'AddWxsPlugin';

/**
 * WXS文件输出路径
 * @type {string}
 */
const WXS_FILENAME = 'wxs/clsx.wxs';

/**
 * AddWxsPlugin - 将clsx.wxs文件添加到编译结果中，并替换WXML文件中的占位符
 *
 * 该插件主要完成两个任务：
 * 1. 将@into-mini/clsx/index.wxs文件内容输出到编译结果中
 * 2. 处理所有.wxml文件，将CLSX_PLACEHOLDER替换为相对路径的wxs引用
 */
export class AddWxsPlugin {
  /**
   * 应用插件到webpack编译器
   * @param {import('webpack').Compiler} compiler - webpack编译器实例
   */
  apply(compiler) {
    const {
      sources: { RawSource, ReplaceSource },
      Compilation,
    } = compiler.webpack;

    // 获取wxs文件内容
    const wxsContent = this.#getWxsContent();

    compiler.hooks.make.tap(PLUGIN_NAME, (compilation) => {
      // 创建emitFile函数
      const emitFile = createEmitFile({
        PLUGIN_NAME,
        compilation,
        RawSource,
        Compilation,
      });

      // 输出wxs文件
      emitFile(WXS_FILENAME, wxsContent);

      // 处理资源，替换占位符
      this.#processAssets(compilation, Compilation, ReplaceSource);
    });
  }

  /**
   * 获取wxs文件内容
   * @returns {string} wxs文件内容
   * @private
   */
  #getWxsContent() {
    return readFileSync(
      fileURLToPath(import.meta.resolve('@into-mini/clsx/index.wxs')),
      'utf8',
    );
  }

  /**
   * 处理编译资源，替换占位符
   * @param {import('webpack').Compilation} compilation - webpack编译实例
   * @param {import('webpack').Compilation} Compilation - webpack Compilation类
   * @param {import('webpack').sources.ReplaceSource} ReplaceSource - webpack ReplaceSource类
   * @private
   */
  #processAssets(compilation, Compilation, ReplaceSource) {
    compilation.hooks.processAssets.tap(
      {
        name: PLUGIN_NAME,
        stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY,
      },
      (assets) => {
        for (const [assetName, source] of Object.entries(assets)) {
          this.#processWxmlAsset(assetName, source, compilation, ReplaceSource);
        }
      },
    );
  }

  /**
   * 处理单个WXML资源文件
   * @param {string} assetName - 资源文件名
   * @param {import('webpack').sources.Source} source - 资源源码
   * @param {import('webpack').Compilation} compilation - webpack编译实例
   * @param {import('webpack').sources.ReplaceSource} ReplaceSource - webpack ReplaceSource类
   * @private
   */
  #processWxmlAsset(assetName, source, compilation, ReplaceSource) {
    // 只处理wxml文件且包含占位符的资源
    if (
      extname(assetName) !== '.wxml' ||
      !source.source().includes(CLSX_PLACEHOLDER)
    ) {
      return;
    }

    const sourceContent = source.source();
    const placeholderIndex = sourceContent.indexOf(CLSX_PLACEHOLDER);

    if (placeholderIndex === -1) {
      return;
    }

    // 计算相对路径
    const relativePath = slash(relative(join(assetName, '..'), WXS_FILENAME));

    // 替换占位符
    const replaceSource = new ReplaceSource(source);
    replaceSource.replace(
      placeholderIndex,
      placeholderIndex + CLSX_PLACEHOLDER.length - 1,
      relativePath,
    );

    // 更新资源
    compilation.updateAsset(assetName, replaceSource);
  }
}
