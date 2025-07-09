import { kebabCase } from 'change-case';
import { deepmerge as deepMerge } from 'deepmerge-ts';
import { parse as yamlParse } from 'yaml';

import { toJSONString } from './utils.mjs';

export function mergeConfig(customBlocks, pair = []) {
  const usingComponents =
    pair.length > 0
      ? new Map(
          pair
            .filter(({ generic }) => !generic)
            .map(({ local, source }) => [kebabCase(local), source]),
        )
      : undefined;

  const componentGenerics =
    pair.length > 0
      ? new Map(
          pair
            .filter(({ generic }) => generic)
            .map(({ local, source }) => [
              kebabCase(local),
              { default: source },
            ]),
        )
      : undefined;

  const blocks = [
    ...(customBlocks?.length ? customBlocks : []),
    {
      type: 'config',
      lang: 'json',
      content: toJSONString({
        component: true,
        ...(usingComponents?.size > 0
          ? {
              usingComponents: Object.fromEntries(usingComponents.entries()),
            }
          : undefined),
        ...(componentGenerics?.size > 0
          ? {
              componentGenerics: Object.fromEntries(
                componentGenerics.entries(),
              ),
            }
          : undefined),
      }),
    },
  ];

  const configs = blocks
    .filter(
      (block) =>
        block &&
        block.type === 'config' &&
        (block.lang === 'json' || block.lang === 'yaml') &&
        block.content &&
        block.content.trim(),
    )
    .map((block) =>
      block.lang === 'yaml'
        ? yamlParse(block.content)
        : JSON.parse(block.content),
    );

  return configs.length > 1 ? deepMerge(...configs) : configs[0] || {};
}
