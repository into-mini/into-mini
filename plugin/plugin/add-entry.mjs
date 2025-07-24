export class AddEntryPlugin {
  PLUGIN_NAME = 'AddEntryPlugin';

  #addSmartEntry({ name, path, layer }) {
    if (this.compiler.__entries__.get(name) !== path) {
      this.compiler.__entries__.set(name, { path, layer });
    }
  }

  #addEntries(compilation) {
    const { compiler } = this;

    const { createDependency } = compiler.webpack.EntryPlugin;

    compilation.hooks.buildModule.tap(this.PLUGIN_NAME, () => {
      for (const [name, { path, layer }] of compiler.__entries__.entries()) {
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
    this.compiler = compiler;

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
      this.#addEntries(compilation);
    });
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compilation);
    });
    compiler.hooks.make.tap(PLUGIN_NAME, (compilation) => {
      this.#addEntries(compilation);
    });
  }
}
