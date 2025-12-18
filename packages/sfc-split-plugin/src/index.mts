import { fileURLToPath } from 'node:url';

import { AddWxsPlugin } from './plugin/add-wxs.mts';
// import { ExposeEntryNamePlugin } from './plugin/expose-entry.mts';
import { EntryRenamePlugin } from './plugin/entry-rename.mts';
// import { SfcSplitPluginBase } from './plugin/sfc-split.mts';
import type { Options } from './plugin/sfc-split.mts';
// import { MinaRuntimeWebpackPlugin } from './plugin/mina-runtime.mts';
import type { Compiler, WebpackPluginInstance } from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

export const COMPONENT_ROOT = 'as-components';

function reach(path: string) {
  return fileURLToPath(import.meta.resolve(path));
}

const theLoader = reach('@into-mini/sfc-split-loader/src/index.mts');

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
      // {
      //   test: /\.vue$/,
      //   use: [
      //     {
      //       loader: reach('./loader/fake-vue-loader.mts'),
      //       options: {
      //         componentRoot: COMPONENT_ROOT,
      //       },
      //     },
      //   ],
      // },
      {
        test: /\.vue$/,
        issuer: /\.vue$/,
        resourceQuery: /type=script/,
        type: 'javascript/esm',
        loader: theLoader,
      },
      {
        test: /\.vue$/,
        issuer: /\.vue$/,
        resourceQuery: /type=template/,
        type: 'asset/resource',
        generator: {
          filename: '[path][name].[hash:8].wxml',
        },
        use: [
          // {
          //   loader: reach('@into-mini/wxml-loader'),
          // },
          {
            loader: theLoader,
          },
        ],
      },
      {
        test: /\.vue$/,
        issuer: /\.vue$/,
        resourceQuery: /type=style/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader' },
          { loader: theLoader },
        ],
      },
      {
        test: /\.vue$/,
        issuer: /\.vue$/,
        resourceQuery: [/type=config&lang=json/],
        type: 'asset/resource',
        generator: {
          filename: '[path][hash:8].json',
        },
        loader: theLoader,
      },
      {
        test: /\.vue$/,
        resourceQuery: { not: /type=/ },
        type: 'javascript/esm',
        enforce: 'pre',
        use: [
          {
            loader: theLoader,
          },
          {
            loader: reach('@into-mini/sfc-split-loader/src/next.mts'),
            options: this.options,
          },
        ],
      },
    );
  }

  apply(compiler: Compiler) {
    this.#applyLoader(compiler);

    const { type } = this.options;

    if (type) {
      new AddWxsPlugin().apply(compiler);
      // new MinaRuntimeWebpackPlugin().apply(compiler);
      // new SfcSplitPluginBase({ tagMatcher, preserveTap }).apply(compiler);
      // new ExposeEntryNamePlugin().apply(compiler);
      new EntryRenamePlugin({
        issuer: /\.vue$/,
        test: /\.wxml|json/,
      }).apply(compiler);
    }
  }
}
