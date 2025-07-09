export const COMPONENT_ROOT = 'as-components';

function unique(...arr) {
  return [...new Set(arr)];
}

export function getAllPages(config = {}) {
  const {
    entryPagePath,
    pages = [],
    subPackages = [],
    tabBar: { custom = false, list = [] } = {},
  } = config;

  return unique(
    entryPagePath,
    ...pages,
    ...list.map(({ pagePath }) => pagePath),
    ...subPackages.flatMap(
      (subPackage) =>
        (subPackage.pages || []).map((page) => `${subPackage.root}/${page}`) ||
        [],
    ),
    custom === true ? 'custom-tab-bar/index' : '',
  ).filter(Boolean);
}

export function patchConfig(json = {}) {
  const object = structuredClone(json);

  object.pages ??= [];

  if (object.tabBar?.list?.length > 0) {
    for (const tab of object.tabBar.list) {
      if (tab.pagePath && !object.pages.includes(tab.pagePath)) {
        object.pages.push(tab.pagePath);
      }
    }
  }

  object.lazyCodeLoading = 'requiredComponents';
  object.subPackages ??= [];
  object.preloadRule ??= {};

  for (const page of object.pages) {
    object.preloadRule[page] ??= {};

    object.preloadRule[page].network = 'all';
    object.preloadRule[page].packages ??= [];

    if (!object.preloadRule[page].packages.includes(COMPONENT_ROOT)) {
      object.preloadRule[page].packages.push(COMPONENT_ROOT);
    }
  }

  if (
    !object.subPackages.some((subPackage) => subPackage.root === COMPONENT_ROOT)
  ) {
    object.subPackages.push({
      root: COMPONENT_ROOT,
      pages: ['fake'],
    });
  }

  return object;
}
