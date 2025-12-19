// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { createHash } from 'node:crypto';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import slash from 'slash';
import type { LoaderContext } from 'webpack';

function createShortHash(input: string) {
  return createHash('sha256').update(input).digest('hex').slice(0, 8);
}

function reach(path: string) {
  return fileURLToPath(import.meta.resolve(path));
}

const componentRoot = 'as-components';

function handleImport({
  toThis,
  addSmartEntry,
  context,
  rootContext,
  maps,
  callback,
}) {
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
          const placer = toThis(entryName);
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
  const { entryName: thisEntryName } = this;

  const config = JSON.parse(source.trim() || '{}');

  const { rootContext, context } = this;

  function toThis(entryName) {
    return slash(relative(`/${thisEntryName}/..`, `/${entryName}`));
  }

  // eslint-disable-next-line unicorn/consistent-function-scoping
  const addSmartEntry = (io) => {
    this.addSmartEntry(io);
  };

  if (config?.usingComponents) {
    handleImport.bind(this)({
      toThis,
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
      toThis,
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

  callback(null, JSON.stringify(config));
}
