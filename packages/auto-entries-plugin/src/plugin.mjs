/* eslint-disable no-param-reassign */

import { AddEntryPlugin } from './plugin/add-entry.mjs';
import { CopyConfigPlugin } from './plugin/copy-config.mjs';
import { EmitFakePlugin } from './plugin/emit-fake.mjs';
import { FindEntryPlugin } from './plugin/find-entry.mjs';

export class AutoEntriesPlugin {
  constructor({ type = false } = {}) {
    this.type = type;
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

    const { type } = this;

    if (type) {
      new AddEntryPlugin().apply(compiler);
      // new EntryRenamePlugin({ issuer: /\.vue$/, test: /\.wxml/ }).apply(
      //   compiler,
      // );
      new FindEntryPlugin({ type }).apply(compiler);
      new CopyConfigPlugin({ type }).apply(compiler);
    }

    if (type === 'miniprogram') {
      new EmitFakePlugin().apply(compiler);
    }
  }
}
