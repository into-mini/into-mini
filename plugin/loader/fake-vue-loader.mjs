import { createHash } from 'node:crypto';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { toJSONString } from '@into-mini/sfc-transformer/utils.mjs';
import slash from 'slash';

function createShortHash(input) {
  return createHash('sha256').update(input).digest('hex').slice(0, 8);
}

function reach(path) {
  return fileURLToPath(import.meta.resolve(path));
}

function handleImport({
  toThis,
  addSmartEntry,
  componentRoot,
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
                createShortHash(slash(absolutePath)),
              ].join('/')
            : relativePath.replace(/\.vue$/, '');
          const placer = toThis(entryName);
          callback({
            name,
            placer,
          });

          const entryPath = path.startsWith('.')
            ? relativePath.startsWith('..')
              ? absolutePath
              : `./${relativePath}`
            : path;

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

export default function loader(source, map, meta) {
  this.cacheable();
  const callback = this.async();
  const { componentRoot } = this.getOptions();
  const { entryName: thisEntryName } = this;
  const resourcePath = slash(this.resourcePath);
  const { paths, config, script } = this.processSfcFile({
    source,
    resourcePath,
  });
  const { rootContext, context } = this;

  for (const path of paths) {
    const filePath = join(rootContext, path);
    this.addDependency(filePath);
    this.addMissingDependency(filePath);
  }

  function toThis(entryName) {
    return slash(relative(`/${thisEntryName}/..`, `/${entryName}`));
  }

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
      componentRoot,
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

  const file = [
    ...paths
      .map((path) => relative(`${resourcePath}/..`, path))
      .map((path) => `import "./${path}";`),
    script,
  ].join('\n');
  this.emitFile(`${thisEntryName}.json`, toJSONString(config));
  callback(null, file, map, meta);
}
