export class AddEntryPlugin {
  PLUGIN_NAME = 'AddEntryPlugin';

  constructor() {
    this.newEntries = new Map();
  }

  #addNewEntry({ entryName, entryPath }) {
    this.newEntries.set(entryName, entryPath);
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
      }
    });
  }

  apply(compiler) {
    compiler.hooks.compilation.tap(this.PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
    compiler.hooks.thisCompilation.tap(this.PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });
    compiler.hooks.make.tap(this.PLUGIN_NAME, (compilation) => {
      this.#addEntries(compiler, compilation);
    });

    const { NormalModule } = compiler.webpack;

    compiler.hooks.compilation.tap(this.PLUGIN_NAME, (compilation) => {
      const addNewEntry = (io) => this.#addNewEntry(io);

      NormalModule.getCompilationHooks(compilation).loader.tap(
        this.PLUGIN_NAME,
        (loaderContext) => {
          Object.defineProperty(loaderContext, 'addNewEntry', {
            enumerable: true,
            configurable: false,
            get() {
              return addNewEntry;
            },
          });
        },
      );
    });
  }
}
