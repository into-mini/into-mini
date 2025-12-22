import { AddWxsPlugin } from './plugin/add-wxs.mts';
import { ExposeEntryNamePlugin } from './plugin/expose-entry.mts';
import { EntryRenamePlugin } from './plugin/entry-rename.mts';
import { MinaRuntimeWebpackPlugin } from './plugin/mina-runtime.mts';
import type { Compiler, WebpackPluginInstance } from 'webpack';

import type { Options } from '@into-mini/sfc-transformer/src/transformer.mts';

export class SfcSplitPlugin implements WebpackPluginInstance {
  options: Options;

  constructor({ type = false, tagMatcher, preserveTap }: Options = {}) {
    this.options = {
      type,
      tagMatcher,
      preserveTap,
    };
  }

  apply(compiler: Compiler) {
    const { type } = this.options;

    if (type) {
      new AddWxsPlugin().apply(compiler);
      new MinaRuntimeWebpackPlugin().apply(compiler);
      new ExposeEntryNamePlugin().apply(compiler);
      new EntryRenamePlugin({
        issuer: /\.vue$/,
        test: /\.wxml|json/,
      }).apply(compiler);
    }
  }
}
