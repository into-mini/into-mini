import sortKeys from 'sort-keys';

export class EmitEntriesPlugin {
  PLUGIN_NAME = 'EmitEntriesPlugin';

  EMIT_PATH = '$debug$/entries.json';

  #getEntries(compilation) {
    return Object.fromEntries(
      compilation.entries
        .values()
        .map(({ dependencies, options: { name, ...options } }) => [
          name,
          {
            ...options,
            import: options.import || dependencies.map((d) => d.request),
          },
        ]),
    );
  }

  #formatter(config) {
    const sorted = sortKeys(config, { deep: true });

    return JSON.stringify(sorted, null, 2);
  }

  #emitEntries(compilation, RawSource) {
    const io = this.#getEntries(compilation);
    const string = this.#formatter(io);
    compilation.emitAsset(this.EMIT_PATH, new RawSource(string));
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
