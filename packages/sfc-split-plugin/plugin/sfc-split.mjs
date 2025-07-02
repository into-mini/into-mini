import path from 'node:path';

import { parse } from '@into-mini/sfc-transformer';
import { mergeConfig } from '@into-mini/sfc-transformer/merge-config.mjs';
import slash from 'slash';
import VirtualModulesPlugin from 'webpack-virtual-modules';

export class SfcSplitPlugin extends VirtualModulesPlugin {
  PLUGIN_NAME = 'SfcSplitPlugin';

  apply(compiler) {
    this.#expose(compiler);

    super.apply(compiler);
  }

  #expose(compiler) {
    const { PLUGIN_NAME } = this;

    const {
      NormalModule: { getCompilationHooks },
    } = compiler.webpack;

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      getCompilationHooks(compilation).loader.tap(
        PLUGIN_NAME,
        (loaderContext) => {
          Object.defineProperty(loaderContext, 'processSfcFile', {
            enumerable: true,
            configurable: false,
            value: (options) => {
              return this.#processSfcFile(options);
            },
          });
        },
      );
    });
  }

  #inject(resourcePath, ext, content) {
    const src = path.resolve(resourcePath.replace(/\.vue$/, ext));

    super.writeModule(src, content);

    return src;
  }

  #injectStyle(resourcePath, id, style) {
    return this.#inject(
      resourcePath,
      `-${id}.${style.lang ?? 'css'}`,
      style.content,
    );
  }

  #injectStyles(resourcePath, styles) {
    const io = [];

    const css = styles?.length > 0 ? styles : [];

    css.forEach((style, idx) => {
      if (style?.content) {
        const src = this.#injectStyle(resourcePath, idx, style);
        io.push(src);
      }
    });

    return io;
  }

  #injectTemplate(resourcePath, tpl) {
    return this.#inject(resourcePath, '.wxml', tpl);
  }

  // eslint-disable-next-line class-methods-use-this
  #injectConfig(customBlocks, pair) {
    return mergeConfig(customBlocks, pair);
  }

  #processSfcFile({ source, resourcePath }) {
    const { tpl, styles, customBlocks, code, pair = [] } = parse(source);

    const { config } = this.#injectConfig(customBlocks, pair);

    const paths = [];

    const wxml = this.#injectTemplate(resourcePath, tpl);
    paths.push(wxml);

    const css = this.#injectStyles(resourcePath, styles);
    paths.push(...css);

    return {
      config,
      paths: paths.map((src) => slash(src)),
      script: code,
    };
  }
}
