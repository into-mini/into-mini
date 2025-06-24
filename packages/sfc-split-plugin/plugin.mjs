import { fileURLToPath } from 'node:url';

import { COMPONENT_ROOT } from './helper/index.mjs';
import { AddEntryPlugin } from './plugin/add-entry.mjs';
import { AddWxsPlugin } from './plugin/add-wxs.mjs';
import { CopyConfigPlugin } from './plugin/copy-config.mjs';
import { EmitFakePlugin } from './plugin/emit-fake.mjs';
import { ExposeEntryNamePlugin } from './plugin/expose-entry.mjs';
import { FindEntryPlugin } from './plugin/find-entry.mjs';
import { SfcSplitPlugin } from './plugin/sfc-split.mjs';

export class AllInOnePlugin {
  constructor({ type = false } = {}) {
    this.type = type;
  }

  #applyLoader(compiler) {
    compiler.options.module.rules.push(
      {
        exclude: /\.(vue|wxml)$/,
        layer: 'other',
      },
      {
        test: /\.vue$/,
        loader: fileURLToPath(
          import.meta.resolve('./loader/fake-vue-loader.cjs'),
        ),
        options: {
          api: this,
          componentRoot: COMPONENT_ROOT,
        },
      },
      {
        test: /\.wxml$/,
        type: 'asset/resource',
        loader: fileURLToPath(
          import.meta.resolve('./loader/wxml-parse-loader.cjs'),
        ),
        generator: {
          filename: (args) => `${args.module.layer}[ext]`,
        },
      },
    );
  }

  apply(compiler) {
    this.#applyLoader(compiler);

    const { type } = this;

    if (type) {
      this.sfc = new SfcSplitPlugin();
      this.sfc.apply(compiler);
      this.add = new AddEntryPlugin();
      this.add.apply(compiler);
      new ExposeEntryNamePlugin().apply(compiler);
      new FindEntryPlugin({ type }).apply(compiler);
      new CopyConfigPlugin({ type }).apply(compiler);
      new AddWxsPlugin().apply(compiler);
    }

    if (type === 'miniprogram') {
      new EmitFakePlugin().apply(compiler);
    }
  }
}
