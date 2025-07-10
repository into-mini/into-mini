import { fileURLToPath } from 'node:url';

import { patchConfig } from '../helper/index.mjs';

function reach(path) {
  return fileURLToPath(import.meta.resolve(path));
}

const emptyJSON = reach('@best-shot/sfc-split-plugin/helper/empty.json');
const yamlLoader = reach('yaml-patch-loader');

export const configKeys = {
  app: 'app-json',
  projectPrivate: 'project.private.config',
  project: 'project.config',
};

export class CopyConfigPlugin {
  constructor({ type = false } = {}) {
    this.type = type;
  }

  addConfigSmartEntry({
    layer,
    from = layer,
    name = layer,
    filename = from,
    options,
  }) {
    const path = `./${from}.yaml`;

    this.compiler.options.entry[name] = {
      import: [path],
      layer,
      runtime: false,
      filename,
    };

    this.compiler.options.resolve.fallback[path] = emptyJSON;

    this.compiler.options.module.rules.push({
      issuerLayer: layer,
      loader: yamlLoader,
      type: 'asset/resource',
      generator: {
        filename: `${filename}.json`,
      },
      options,
    });
  }

  apply(compiler) {
    const { type } = this;
    this.compiler = compiler;

    if (type) {
      this.addConfigSmartEntry({
        layer: configKeys.project,
        options: {
          modify: (json) => ({
            srcMiniprogramRoot: '',
            miniprogramRoot: '',
            pluginRoot: '',
            ...json,
            compileType: type,
          }),
        },
      });

      this.addConfigSmartEntry({
        layer: configKeys.projectPrivate,
      });

      if (this.type === 'miniprogram') {
        this.addConfigSmartEntry({
          layer: configKeys.app,
          from: 'app',
          options: {
            modify: patchConfig,
          },
        });

        this.compiler.options.entry.app = {
          import: ['./app'],
        };
      }
    }
  }
}
