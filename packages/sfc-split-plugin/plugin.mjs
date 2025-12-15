import { fileURLToPath } from 'node:url';

import { AddWxsPlugin } from './plugin/add-wxs.mjs';
import { ExposeEntryNamePlugin } from './plugin/expose-entry.mjs';
// import { EntryRenamePlugin } from './plugin/entry-rename.mjs';
import { SfcSplitPluginBase } from './plugin/sfc-split.mjs';
import { MinaRuntimeWebpackPlugin } from './plugin/mina-runtime.mjs';

export const COMPONENT_ROOT = 'as-components';

function reach(path) {
  return fileURLToPath(import.meta.resolve(path));
}

export class SfcSplitPlugin {
  constructor({ type = false, tagMatcher, preserveTap } = {}) {
    this.type = type;
    this.tagMatcher = tagMatcher;
    this.preserveTap = preserveTap;
  }

  #applyLoader(compiler) {
    compiler.options.module.rules.push(
      // {
      //   exclude: /\.(vue|wxml)$/,
      //   layer: 'other',
      // },
      {
        test: /\.vue$/,
        loader: reach('./loader/fake-vue-loader.mjs'),
        options: {
          componentRoot: COMPONENT_ROOT,
        },
      },
      {
        test: /\.wxml$/,
        type: 'asset/resource',
        loader: reach('@into-mini/wxml-loader'),
        generator: {
          filename: '[entry][ext]',
          // filename: '[contenthash:8][ext]',
        },
      },
    );
  }

  apply(compiler) {
    this.#applyLoader(compiler);

    const { type, tagMatcher, preserveTap } = this;

    if (type) {
      new AddWxsPlugin().apply(compiler);
      new MinaRuntimeWebpackPlugin().apply(compiler);
      new SfcSplitPluginBase({ tagMatcher, preserveTap }).apply(compiler);
      new ExposeEntryNamePlugin().apply(compiler);
      // new EntryRenamePlugin({ issuer: /\.vue$/, test: /\.wxml/ }).apply(
      //   compiler,
      // );
    }
  }
}
