/* eslint-disable no-continue */
import path from 'node:path';
import type { Compiler, WebpackPluginInstance } from 'webpack';

const pluginName = 'EntryRenamePlugin';

type Matcher = RegExp | string | ((value: string) => boolean);

export interface EntryAssetNamePluginOptions {
  issuer?: Matcher;
  test?: Matcher;
}

export class EntryRenamePlugin implements WebpackPluginInstance {
  private options: EntryAssetNamePluginOptions;

  constructor(options: EntryAssetNamePluginOptions = {}) {
    this.options = options;
  }

  private getIssuerPath(issuerModule: any): string | undefined {
    return (
      issuerModule?.nameForCondition?.() ??
      issuerModule?.resource ??
      issuerModule?.identifier?.()
    );
  }

  private matchIssuer(issuerPath: string | undefined): boolean {
    const { issuer } = this.options;

    if (!issuer) {
      return true;
    }

    if (!issuerPath) {
      return false;
    }

    if (issuer instanceof RegExp) {
      return issuer.test(issuerPath);
    }

    if (typeof issuer === 'function') {
      return issuer(issuerPath);
    }

    return issuerPath.includes(issuer);
  }

  private matchTest(filename: string): boolean {
    const { test } = this.options;

    if (!test) {
      return true;
    }

    if (test instanceof RegExp) {
      return test.test(filename);
    }

    if (typeof test === 'function') {
      return test(filename);
    }

    return filename.includes(test);
  }

  apply(compiler: Compiler): void {
    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      const { Compilation } = compiler.webpack;

      compilation.hooks.processAssets.tap(
        { name: pluginName, stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS },
        () => {
          for (const module of compilation.modules) {
            const filename = module.buildInfo?.filename;

            if (!filename) {
              continue;
            }

            if (!this.matchTest(filename)) {
              continue;
            }

            const issuerModule = compilation.moduleGraph.getIssuer(module);
            const issuerPath = this.getIssuerPath(issuerModule);

            if (!this.matchIssuer(issuerPath)) {
              continue;
            }

            const chunks = compilation.chunkGraph.getModuleChunks(module);
            const entryChunk = [...chunks].find((chunk) => chunk.name);

            if (!entryChunk?.name) {
              continue;
            }

            const ext = path.extname(filename);
            const newName = `${entryChunk.name}${ext}`;

            if (newName === filename) {
              continue;
            }

            if (compilation.getAsset(newName)) {
              continue;
            }

            compilation.renameAsset(filename, newName);
          }
        },
      );
    });
  }
}
