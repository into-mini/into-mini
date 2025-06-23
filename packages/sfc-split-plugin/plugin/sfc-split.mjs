import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parse } from '@into-mini/sfc-transformer';
import { mergeConfig } from '@into-mini/sfc-transformer/merge-config.mjs';
import slash from 'slash';
import VirtualModulesPlugin from 'webpack-virtual-modules';

import { COMPONENT_ROOT } from '../helper/index.mjs';

const PLUGIN_NAME = 'SfcSplitPlugin';

export class SfcSplitPlugin extends VirtualModulesPlugin {
  constructor() {
    super();
    this.newEntries = new Map();
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
          import.meta.resolve('../loader/fake-vue-loader.cjs'),
        ),
        options: {
          api: this,
          componentRoot: COMPONENT_ROOT,
          caller: ({ entryName, entryPath }) => {
            this.newEntries.set(entryName, entryPath);
          },
        },
      },
      {
        test: /\.wxml$/,
        type: 'asset/resource',
        loader: fileURLToPath(
          import.meta.resolve('../loader/wxml-parse-loader.cjs'),
        ),
        generator: {
          filename: (args) => `${args.module.layer}[ext]`,
        },
      },
    );
  }

  #addEntries(compiler, compilation, callback) {
    const {
      EntryPlugin: { createDependency },
    } = compiler.webpack;

    // compilation.hooks.buildModule.tap(PLUGIN_NAME, () => {

    if (callback) {
      const temp = [...this.newEntries.entries()].map(
        ([entryName, entryPath]) => {
          return new Promise((resolve, reject) => {
            compilation.addEntry(
              compiler.context,
              createDependency(entryPath),
              {
                name: entryName,
                layer: entryName,
                import: [entryPath],
              },
              (err) => (err ? reject(err) : resolve()),
            );

            compilation.fileDependencies.add(entryPath);
          });
        },
      );
      Promise.all(temp).then(() => callback(), callback);
    } else {
      [...this.newEntries.entries()].forEach(([entryName, entryPath]) => {
        compilation.addEntry(
          compiler.context,
          createDependency(entryPath),
          {
            name: entryName,
            layer: entryName,
            import: [entryPath],
          },
          (err) => {
            if (err) {
              throw err;
            }
          },
        );

        compilation.fileDependencies.add(entryPath);
      });
    }
    // });
  }

  apply(compiler) {
    super.apply(compiler);

    this.#applyLoader(compiler);

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
    compiler.hooks.make.tapAsync(PLUGIN_NAME, (compilation, callback) => {
      this.#addEntries(compiler, compilation, callback);
    });
  }

  inject(resourcePath, ext, content) {
    const src = path.resolve(resourcePath.replace(/\.vue$/, ext));

    super.writeModule(src, content);

    return src;
  }

  injectStyle(resourcePath, id, style) {
    return this.inject(
      resourcePath,
      `-${id}.${style.lang ?? 'css'}`,
      style.content,
    );
  }

  injectStyles(resourcePath, styles) {
    const io = [];

    const css = styles?.length > 0 ? styles : [];

    css.forEach((style, idx) => {
      if (style?.content) {
        const src = this.injectStyle(resourcePath, idx, style);
        io.push(src);
      }
    });

    return io;
  }

  injectTemplate(resourcePath, tpl) {
    return this.inject(resourcePath, '.wxml', tpl);
  }

  // eslint-disable-next-line class-methods-use-this
  injectConfig(customBlocks, pair) {
    return mergeConfig(customBlocks, pair);
  }

  processSfcFile(source, resourcePath) {
    const { tpl, styles, customBlocks, code, pair = [] } = parse(source);

    const { config } = this.injectConfig(customBlocks, pair);

    const paths = [];

    const wxml = this.injectTemplate(resourcePath, tpl);
    paths.push(wxml);

    const css = this.injectStyles(resourcePath, styles);
    paths.push(...css);

    return {
      config,
      paths: paths.map((src) => slash(src)),
      script: code,
    };
  }
}
