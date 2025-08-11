/* eslint-disable no-param-reassign */
import { fileURLToPath } from 'node:url';

import { COMPONENT_ROOT } from './helper/index.mjs';
import { configKeys } from './helper/utils.mjs';
import { AddEntryPlugin } from './plugin/add-entry.mjs';
import { AddWxsPlugin } from './plugin/add-wxs.mjs';
import { CopyConfigPlugin } from './plugin/copy-config.mjs';
import { EmitFakePlugin } from './plugin/emit-fake.mjs';
import { ExposeEntryNamePlugin } from './plugin/expose-entry.mjs';
import { FindEntryPlugin } from './plugin/find-entry.mjs';
import { SfcSplitPlugin } from './plugin/sfc-split.mjs';
import { MinaRuntimeWebpackPlugin } from './plugin/mina-runtime.mjs';

function reach(path) {
  return fileURLToPath(import.meta.resolve(path));
}

export class AllInOnePlugin {
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
        },
      },
      {
        test: /\.hack$/,
        type: 'javascript/esm',
        layer: configKeys.hack,
        loader: reach('./loader/hack-entry-loader.mjs'),
      },
    );
  }

  #prepare(compiler) {
    compiler.options.resolve.extensionAlias ??= {};

    compiler.options.resolve.extensionAlias['.yaml'] = [
      '.yaml',
      '.yml',
      '.json',
    ];

    compiler.options.resolve.fallback ??= {};

    if (compiler.options.entry?.main) {
      delete compiler.options.entry.main;
    }

    Object.assign(compiler, {
      __entries__: new Map(),
    });
  }

  apply(compiler) {
    this.#prepare(compiler);
    this.#applyLoader(compiler);

    const { type, tagMatcher, preserveTap } = this;

    if (type) {
      new MinaRuntimeWebpackPlugin().apply(compiler);
      new AddEntryPlugin().apply(compiler);
      new AddWxsPlugin().apply(compiler);
      new SfcSplitPlugin({ tagMatcher, preserveTap }).apply(compiler);
      new ExposeEntryNamePlugin().apply(compiler);
      new FindEntryPlugin({ type }).apply(compiler);
      new CopyConfigPlugin({ type }).apply(compiler);
    }

    if (type === 'miniprogram') {
      new EmitFakePlugin().apply(compiler);
    }
  }
}
