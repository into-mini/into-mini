export class AddEntryPlugin {
  PLUGIN_NAME = 'AddEntryPlugin';

  constructor() {
    this.newEntries = new Map();
  }

  addEntry({ entryName, entryPath }) {
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
            } else {
              compilation.fileDependencies.add(entryPath);
            }
          },
        );
      }
    });
  }

  apply(compiler) {
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
