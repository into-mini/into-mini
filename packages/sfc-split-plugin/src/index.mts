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
  options: Options;

  constructor({ type = false, tagMatcher, preserveTap }: Options = {}) {
    this.options = {
      type,
      tagMatcher,
      preserveTap,
    };
  }

  #applyLoader(compiler: Compiler) {
    compiler.options.module.rules.push(
      {
        test: /\.vue$/,
        use: [
          {
            loader: reach('./loader/fake-vue-loader.mts'),
            options: {
              componentRoot: COMPONENT_ROOT,
            },
          },
          {
            loader: reach('@into-mini/sfc-split-loader/src/next.mts'),
            options: this.options,
          },
        ],
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

    const { type, tagMatcher, preserveTap } = this.options;

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
