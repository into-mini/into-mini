import { fileURLToPath } from 'node:url';

const PLUGIN_NAME = 'CopyConfigPlugin';

function reach(path) {
  return fileURLToPath(import.meta.resolve(path));
}

export class CopyConfigPlugin {
  constructor({ type = false } = {}) {
    this.type = type;
  }

  apply(compiler) {
    const { type } = this;

    const yamlLoader = reach('yaml-patch-loader');
    const emptyYaml = reach('@best-shot/sfc-split-plugin/helper/empty.yaml');

    compiler.hooks.entryOption.tap(PLUGIN_NAME, (context, entry) => {
      entry['project-config'] = {
        import: ['./project.config.yaml'],
        layer: 'project-config',
      };

      entry['project-private-config'] = {
        import: ['./project.private.config.yaml'],
        layer: 'project-private-config',
      };

      compiler.options.resolve.fallback ??= {};

      Object.assign(compiler.options.resolve.fallback, {
        './project.config.yaml': emptyYaml,
        './project.private.config.yaml': emptyYaml,
      });

      compiler.options.module.rules.push(
        {
          issuerLayer: 'project-config',
          loader: yamlLoader,
          options: {
            modify: (json) => ({
              srcMiniprogramRoot: '',
              miniprogramRoot: '',
              pluginRoot: '',
              ...json,
              compileType: type,
            }),
          },
          type: 'asset/resource',
          generator: {
            filename: 'project.config.json',
          },
        },
        {
          issuerLayer: 'project-private-config',
          loader: yamlLoader,
          type: 'asset/resource',
          generator: {
            filename: 'project.private.config.json',
          },
        },
      );
    });
  }
}
