import { toJSONString } from '@into-mini/sfc-transformer/utils.mjs';

export class EmitEntriesPlugin {
  PLUGIN_NAME = 'EmitEntriesPlugin';

  #getEntries(compilation) {
    return Object.fromEntries(
      compilation.entries.entries().map(([entryName, entry]) => [
        entryName,
        {
          ...entry.options,
          import:
            entry.options.import || entry.dependencies.map((d) => d.request),
        },
      ]),
    );
  }

  #emitEntries(compilation, RawSource) {
    const io = this.#getEntries(compilation);
    compilation.emitAsset(
      '__debug__/entries.json',
      new RawSource(toJSONString(io)),
    );
  }

  apply(compiler) {
    const { PLUGIN_NAME } = this;

    const { RawSource } = compiler.webpack.sources;

    compiler.hooks.make.tap(PLUGIN_NAME, (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: PLUGIN_NAME,
          stage: compilation.constructor.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          this.#emitEntries(compilation, RawSource);
        },
      );
    });
  }
}
