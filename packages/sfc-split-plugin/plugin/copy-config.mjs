import { fileURLToPath } from 'node:url';

const PLUGIN_NAME = 'CopyConfigPlugin';

export class CopyConfigPlugin {
  apply(compiler) {
    compiler.hooks.entryOption.tap(PLUGIN_NAME, (context, entry) => {
      entry.configs = {
        import: ['./project.config.yaml', './project.private.config.yaml'],
      };

      const yamlLoader = fileURLToPath(import.meta.resolve('yaml-loader'));

      compiler.options.module.rules.push(
        {
          test: /[/\\]project.config\.yaml$/,
          loader: yamlLoader,
          options: { asJSON: true },
          type: 'asset/resource',
          generator: {
            filename: 'project.config.json',
          },
        },
        {
          test: /[/\\]project.private.config\.yaml$/,
          loader: yamlLoader,
          options: { asJSON: true },
          type: 'asset/resource',
          generator: {
            filename: 'project.private.config.json',
          },
        },
      );
    });
  }
}
