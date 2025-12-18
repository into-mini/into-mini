import { fileURLToPath } from 'node:url';

import { AddWxsPlugin } from './plugin/add-wxs.mts';
import { ExposeEntryNamePlugin } from './plugin/expose-entry.mts';
// import { EntryRenamePlugin } from './plugin/entry-rename.mts';
import { MinaRuntimeWebpackPlugin } from './plugin/mina-runtime.mts';
import type { Compiler, WebpackPluginInstance } from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { Options } from '@into-mini/sfc-transformer/src/transformer.mts';

export const COMPONENT_ROOT = 'as-components';

function reach(path: string) {
  return fileURLToPath(import.meta.resolve(path));
}

const theLoader = reach('@into-mini/sfc-split-loader/dist/index.mjs');

type PluginOptions = Options & {
  loaders?: boolean;
};

export class SfcSplitPlugin implements WebpackPluginInstance {
  options: PluginOptions;

  constructor({
    type = false,
    tagMatcher,
    preserveTap,
    loaders = true,
  }: PluginOptions = {}) {
    this.options = {
      type,
      tagMatcher,
      preserveTap,
      loaders,
    };
  }

  #applyLoader(compiler: Compiler) {
    compiler.options.module.rules.push(
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
          filename: '[entry].wxml',
        },
        use: [
          {
            loader: reach('@into-mini/wxml-loader'),
          },
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
          filename: '[entry].json',
        },
        use: [
          {
            loader: reach(
              '@into-mini/sfc-split-plugin/dist/loader/entry-loader.mjs',
            ),
            options: {
              componentRoot: COMPONENT_ROOT,
            },
          },
          {
            loader: theLoader,
          },
        ],
      },
      {
        test: /\.vue$/,
        resourceQuery: { not: /type=/ },
        type: 'javascript/esm',
        loader: theLoader,
      },
      {
        test: /\.vue$/,
        enforce: 'pre',
        loader: reach('@into-mini/sfc-split-loader/dist/next.mjs'),
        options: this.options,
      },
    );
  }

  apply(compiler: Compiler) {
    const { loaders, type } = this.options;

    if (loaders) {
      this.#applyLoader(compiler);
    }

    if (type) {
      new AddWxsPlugin().apply(compiler);
      new MinaRuntimeWebpackPlugin().apply(compiler);
      new ExposeEntryNamePlugin().apply(compiler);
      // new EntryRenamePlugin({
      //   issuer: /\.vue$/,
      //   test: /\.wxml|json/,
      // }).apply(compiler);
    }
  }
}
