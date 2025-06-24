import { readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CLSX_PLACEHOLDER } from '@into-mini/sfc-transformer/utils.mjs';
import slash from 'slash';

// WXS文件输出路径
const WXS_FILENAME = 'wxs/clsx.wxs';

/**
 * 将clsx.wxs文件添加到编译结果中，并替换WXML文件中的占位符。
 * 只在发现CLSX_PLACEHOLDER时添加wxs文件，且只添加一次。
 */
export class AddWxsPlugin {
  PLUGIN_NAME = 'AddWxsPlugin';

  #wxsAdded = false;

  apply(compiler) {
    const {
      sources: { RawSource },
    } = compiler.webpack;

    compiler.hooks.compilation.tap(this.PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: this.PLUGIN_NAME,
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        (assets) => this.#processAssets(assets, compilation, RawSource),
      );
    });
  }

  /**
   * 处理编译资源，检查wxml文件并在需要时添加wxs文件
   */
  #processAssets(assets, compilation, RawSource) {
    let needsWxs = false;

    // 处理所有wxml文件
    Object.entries(assets).forEach(([filename, source]) => {
      if (extname(filename) !== '.wxml') {
        return;
      }

      const content = source.source().toString();

      if (!content.includes(CLSX_PLACEHOLDER)) {
        return;
      }

      // 第一次发现占位符时添加wxs文件
      if (!needsWxs && !this.#wxsAdded) {
        needsWxs = true;
        this.#addWxsFile(compilation, RawSource);
      }

      // 替换占位符为相对路径
      const relativePath = slash(relative(join(filename, '..'), WXS_FILENAME));
      const newContent = content.replace(CLSX_PLACEHOLDER, relativePath);
      compilation.updateAsset(filename, new RawSource(newContent));
    });
  }

  /**
   * 添加wxs文件到编译结果
   */
  #addWxsFile(compilation, RawSource) {
    const wxsPath = import.meta.resolve('@into-mini/clsx/index.wxs');
    const wxsContent = readFileSync(fileURLToPath(wxsPath), 'utf8');

    compilation.emitAsset(WXS_FILENAME, new RawSource(wxsContent));
    console.log('Added clsx.wxs file because CLSX_PLACEHOLDER was found');
    this.#wxsAdded = true;
  }
}
