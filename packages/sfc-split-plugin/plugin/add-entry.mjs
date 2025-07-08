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
      for (const [entryName, { path, layer }] of this.newEntries.entries()) {
        compilation.addEntry(
          compiler.context,
          createDependency(path),
          {
            name: entryName,
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

  apply(compiler) {
    this.#expose(compiler);

    const { PLUGIN_NAME } = this;

    compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
    compiler.hooks.make.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
  }
}
