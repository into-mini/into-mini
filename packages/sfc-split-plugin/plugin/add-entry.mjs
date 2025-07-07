export class AddEntryPlugin {
  PLUGIN_NAME = 'AddEntryPlugin';

  constructor() {
    this.newEntries = new Map();
  }

  #addSmartEntry({ entryName, entryPath }) {
    if (this.newEntries.get(entryName) !== entryPath) {
      this.newEntries.set(entryName, entryPath);
    }
  }

  #addEntries(compiler, compilation) {
    const {
      EntryPlugin: { createDependency },
    } = compiler.webpack;

    compilation.hooks.buildModule.tap(this.PLUGIN_NAME, () => {
      for (const [entryName, entryPath] of this.newEntries.entries()) {
        compilation.addEntry(
          compiler.context,
          createDependency(entryPath),
          {
            name: entryName,
            import: [entryPath],
          },
          (err) => {
            if (err) {
              throw err;
            } else {
              compilation.fileDependencies.add(entryPath);
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
