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

  apply(compiler) {
    const { RawSource } = compiler.webpack.sources;

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

  #processAssets(assets, compilation, RawSource) {
    // 处理所有wxml文件
    for (const [filename, source] of Object.entries(assets)) {
      if (extname(filename) === '.wxml') {
        const content = source.source().toString();

        if (content.includes(CLSX_PLACEHOLDER)) {
          this.#addWxsFile(compilation, RawSource);

          this.#replaceSource(compilation, RawSource, {
            filename,
            content,
          });
        }
      }
    }
  }

  #replaceSource(compilation, RawSource, { filename, content }) {
    const relativePath = slash(relative(join(filename, '..'), WXS_FILENAME));
    const newContent = content.replace(CLSX_PLACEHOLDER, relativePath);
    compilation.updateAsset(filename, new RawSource(newContent));
  }

  #addWxsFile(compilation, RawSource) {
    const wxsPath = import.meta.resolve('@into-mini/clsx/index.wxs');
    const wxsContent = readFileSync(fileURLToPath(wxsPath), 'utf8');

    compilation.emitAsset(WXS_FILENAME, new RawSource(wxsContent));
  }
}
