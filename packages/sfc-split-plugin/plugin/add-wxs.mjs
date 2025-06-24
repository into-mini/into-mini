import { readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CLSX_PLACEHOLDER } from '@into-mini/sfc-transformer/utils.mjs';
import slash from 'slash';

// WXS文件输出路径
const WXS_FILENAME = 'wxs/clsx.wxs';

/**
 * 将clsx.wxs文件添加到编译结果中，并替换WXML文件中的占位符
 */
export class AddWxsPlugin {
  PLUGIN_NAME = 'AddWxsPlugin';

  apply(compiler) {
    const {
      sources: { RawSource },
    } = compiler.webpack;

    compiler.hooks.make.tap(this.PLUGIN_NAME, (compilation) => {
      // 添加wxs文件到编译结果
      this.#addWxsFile(compilation, RawSource);

      // 处理wxml文件中的占位符
      this.#processWxmlFiles(compilation, RawSource);
    });
  }

  /**
   * 添加wxs文件到编译结果
   */
  #addWxsFile(compilation, RawSource) {
    const { PROCESS_ASSETS_STAGE_ADDITIONAL } = compilation.constructor;

    compilation.hooks.processAssets.tap(
      {
        name: this.PLUGIN_NAME,
        stage: PROCESS_ASSETS_STAGE_ADDITIONAL,
      },
      () => {
        const wxsPath = import.meta.resolve('@into-mini/clsx/index.wxs');
        const wxsContent = readFileSync(fileURLToPath(wxsPath), 'utf8');

        compilation.emitAsset(WXS_FILENAME, new RawSource(wxsContent));
      },
    );
  }

  /**
   * 处理wxml文件中的占位符
   */
  #processWxmlFiles(compilation, RawSource) {
    const { PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY } =
      compilation.constructor;

    compilation.hooks.processAssets.tap(
      {
        name: this.PLUGIN_NAME,
        stage: PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY,
      },
      (assets) => {
        Object.entries(assets).forEach(([filename, source]) => {
          // 只处理包含占位符的wxml文件
          if (
            extname(filename) !== '.wxml' ||
            !source.source().includes(CLSX_PLACEHOLDER)
          ) {
            return;
          }

          // 计算wxs文件相对路径并替换占位符
          const relativePath = slash(
            relative(join(filename, '..'), WXS_FILENAME),
          );
          const newContent = source
            .source()
            .toString()
            .replace(CLSX_PLACEHOLDER, relativePath);

          compilation.updateAsset(filename, new RawSource(newContent));
        });
      },
    );
  }
}
