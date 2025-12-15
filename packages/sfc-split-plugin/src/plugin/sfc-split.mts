// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import path from 'node:path';

import { parse } from '@into-mini/sfc-transformer';
import slash from 'slash';
import VirtualModulesPlugin from 'webpack-virtual-modules';
import type { Compiler, WebpackPluginInstance } from 'webpack';

export type Options = {
  type?: boolean;
  tagMatcher?: (tag: string) => { tag: string; path: string };
  preserveTap?: (tag: string) => boolean;
};

export class SfcSplitPluginBase
  extends VirtualModulesPlugin
  implements WebpackPluginInstance
{
  PLUGIN_NAME = 'SfcSplitPluginBase';

  tagMatcher: Options['tagMatcher'];

  preserveTap: Options['preserveTap'];

  constructor({ tagMatcher, preserveTap }: Options) {
    super();
    this.tagMatcher = tagMatcher;
    this.preserveTap = preserveTap;
  }

  override apply(compiler: Compiler) {
    this.#expose(compiler);

    super.apply(compiler);
  }

  #expose(compiler: Compiler) {
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

  #inject(resourcePath: string, ext, content) {
    const src = path.resolve(resourcePath.replace(/\.vue$/, ext));

    super.writeModule(src, content);

    return src;
  }

  #injectStyle(resourcePath: string, id: number, style) {
    return this.#inject(
      resourcePath,
      `-${id}.${style.lang ?? 'css'}`,
      style.content,
    );
  }

  #injectStyles(resourcePath: string, styles) {
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

  #injectTemplate(resourcePath: string, tpl) {
    return this.#inject(resourcePath, '.wxml', tpl);
  }

  #processSfcFile({ source, resourcePath }) {
    const { tagMatcher, preserveTap } = this;

    const { tpl, styles, code, config } = parse(source, {
      tagMatcher,
      preserveTap,
    });

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
