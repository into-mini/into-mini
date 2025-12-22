// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { createHash } from 'node:crypto';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sortKeys from 'sort-keys';

import slash from 'slash';
import type { LoaderContext } from 'webpack';

function createShortHash(input: string) {
  return createHash('sha256').update(input).digest('hex').slice(0, 8);
}

function reach(path: string) {
  return fileURLToPath(import.meta.resolve(path));
}

const componentRoot = 'as-components';

function handleImport({ addSmartEntry, context, rootContext, maps, callback }) {
  if (Object.keys(maps).length > 0) {
    for (const [name, path] of Object.entries(maps)) {
      if (path.endsWith('.vue') && !path.startsWith('plugin://')) {
        try {
          const absolutePath = slash(
            path.startsWith('.') ? resolve(context, path) : reach(path),
          );
          const relativePath = slash(relative(rootContext, absolutePath));
          const hack = relativePath.startsWith('..');
          const entryName = hack
            ? [
                componentRoot,
                absolutePath
                  .split('/')
                  .slice(-2)
                  .join('/')
                  .replace(/\.vue$/, ''),
                createShortHash(slash(relativePath)),
              ].join('/')
            : relativePath.replace(/\.vue$/, '');

          const placer = `/${entryName}`;

          callback({
            name,
            placer,
          });

          const entryPath = relativePath.startsWith('..')
            ? absolutePath
            : `./${relativePath}`;

          this.addDependency(resolve(absolutePath));
          this.addMissingDependency(resolve(absolutePath));
          addSmartEntry({
            name: entryName,
            path: entryPath,
          });
        } catch (error) {
          console.error(error);
        }
      }
    }
  }
}

export default function loader(
  this: LoaderContext<Record<string, any>>,
  source: string,
) {
  this.cacheable();
  const callback = this.async();

  const config = JSON.parse(source.trim() || '{}');

  const { rootContext, context } = this;

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const addSmartEntry = (io) => {
    this.addSmartEntry(io);
  };

  if (config?.usingComponents) {
    handleImport.bind(this)({
      addSmartEntry,
      componentRoot,
      context,
      rootContext,
      maps: config.usingComponents,
      callback({ name, placer }) {
        config.usingComponents[name] = placer;

        if (placer.includes(componentRoot)) {
          config.componentPlaceholder ??= {};
          config.componentPlaceholder[name] = 'view';
        }
      },
    });
  }

  if (config?.componentGenerics) {
    handleImport.bind(this)({
      addSmartEntry,
      context,
      rootContext,
      maps: Object.fromEntries(
        Object.entries(config.componentGenerics)
          .filter(([_, item]) => item?.default)
          .map(([key, item]) => [key, item.default]),
      ),
      callback({ name, placer }) {
        config.componentGenerics[name].default = placer;
      },
    });
  }

  config.componentGenerics &&= sortKeys(config.componentGenerics);
  config.usingComponents &&= sortKeys(config.usingComponents);

  const shouldFormat = this._compiler?.options?.optimization?.minimize !== true;

  const spaces = shouldFormat ? 2 : 0;

  callback(null, JSON.stringify(config, null, spaces));
}
