import { fileURLToPath } from 'node:url';

import { AddWxsPlugin } from './plugin/add-wxs.mts';
import { ExposeEntryNamePlugin } from './plugin/expose-entry.mts';
// import { EntryRenamePlugin } from './plugin/entry-rename.mjs';
import { SfcSplitPluginBase } from './plugin/sfc-split.mts';
import type { Options } from './plugin/sfc-split.mts';
import { MinaRuntimeWebpackPlugin } from './plugin/mina-runtime.mts';
import type { Compiler, WebpackPluginInstance } from 'webpack';

export const COMPONENT_ROOT = 'as-components';

function reach(path: string) {
  return fileURLToPath(import.meta.resolve(path));
}

export class SfcSplitPlugin implements WebpackPluginInstance {
  type: Options['type'];

  tagMatcher: Options['tagMatcher'];

  preserveTap: Options['preserveTap'];

  constructor({ type = false, tagMatcher, preserveTap }: Options = {}) {
    this.type = type;
    this.tagMatcher = tagMatcher;
    this.preserveTap = preserveTap;
  }

  #applyLoader(compiler: Compiler) {
    compiler.options.module.rules.push(
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

  apply(compiler: Compiler) {
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
