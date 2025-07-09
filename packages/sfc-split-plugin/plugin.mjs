/* eslint-disable no-param-reassign */
import { fileURLToPath } from 'node:url';

import { COMPONENT_ROOT } from './helper/index.mjs';
import { AddEntryPlugin } from './plugin/add-entry.mjs';
import { AddWxsPlugin } from './plugin/add-wxs.mjs';
import { CopyConfigPlugin } from './plugin/copy-config.mjs';
import { EmitFakePlugin } from './plugin/emit-fake.mjs';
import { ExposeEntryNamePlugin } from './plugin/expose-entry.mjs';
import { FindEntryPlugin } from './plugin/find-entry.mjs';
import { SfcSplitPlugin } from './plugin/sfc-split.mjs';

function reach(path) {
  return fileURLToPath(import.meta.resolve(path));
}

export class AllInOnePlugin {
  constructor({ type = false } = {}) {
    this.type = type;
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
        loader: reach('./loader/wxml-parse-loader.mjs'),
        generator: {
          filename: '[entry][ext]',
        },
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
  }

  apply(compiler) {
    this.#prepare(compiler);
    this.#applyLoader(compiler);

    const { type } = this;

    if (type) {
      new AddEntryPlugin().apply(compiler);
      new AddWxsPlugin().apply(compiler);
      new SfcSplitPlugin().apply(compiler);
      new ExposeEntryNamePlugin().apply(compiler);
      new FindEntryPlugin({ type }).apply(compiler);
      new CopyConfigPlugin({ type }).apply(compiler);
    }

    if (type === 'miniprogram') {
      new EmitFakePlugin().apply(compiler);
    }
  }
}
