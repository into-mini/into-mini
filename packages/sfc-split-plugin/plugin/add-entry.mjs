export class AddEntryPlugin {
  PLUGIN_NAME = 'AddEntryPlugin';

  constructor() {
    this.newEntries = new Map();
  }

  #addSmartEntry({ name, path, layer }) {
    if (this.newEntries.get(name) !== path) {
      this.newEntries.set(name, { path, layer });
    }
  }

  #addEntries(compiler, compilation) {
    const { createDependency } = compiler.webpack.EntryPlugin;

    compilation.hooks.buildModule.tap(this.PLUGIN_NAME, () => {
      for (const [name, { path, layer }] of this.newEntries.entries()) {
        compilation.addEntry(
          compiler.context,
          createDependency(path, { name }),
          {
            name,
            import: [path],
            layer,
          },
          (err) => {
            if (err) {
              throw err;
            } else {
              compilation.fileDependencies.add(path);
            }
          },
        );
      }
    });
  }

  #expose(compiler) {
    const { PLUGIN_NAME } = this;

    const {
      NormalModule: { getCompilationHooks },
    } = compiler.webpack;

    Object.defineProperty(compiler, 'addSmartEntry', {
      enumerable: true,
      configurable: false,
      value: (options) => {
        this.#addSmartEntry(options);
      },
    });

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      getCompilationHooks(compilation).loader.tap(
        PLUGIN_NAME,
        (loaderContext) => {
          Object.defineProperty(loaderContext, 'addSmartEntry', {
            enumerable: true,
            configurable: false,
            value: (options) => {
              this.#addSmartEntry(options);
            },
          });
        },
      );
    });
  }

  #getEntries(compilation) {
    return Object.fromEntries(
      [...compilation.entries.entries()].map(([entryName, entry]) => [
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
      new RawSource(JSON.stringify(io, null, 2)),
    );
  }

  apply(compiler) {
    this.#expose(compiler);

    const { PLUGIN_NAME } = this;

    const {
      sources: { RawSource },
    } = compiler.webpack;

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
    compiler.hooks.make.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
    compiler.hooks.emit.tap(PLUGIN_NAME, (compilation) => {
      this.#emitEntries(compilation, RawSource);
    });
  }
}
