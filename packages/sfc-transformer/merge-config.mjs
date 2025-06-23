import { kebabCase } from 'change-case';
import { deepmerge as deepMerge } from 'deepmerge-ts';
import { parse as yamlParse } from 'yaml';

import { toJSONString } from './utils.mjs';

export function mergeConfig(customBlocks, pair) {
  const usingComponents =
    pair.length > 0
      ? Object.fromEntries(
          pair
            .filter(({ local }) => !local.endsWith('_generic'))
            .map(({ local, source }) => [kebabCase(local), source]),
        )
      : {};

  const componentGenerics =
    pair.length > 0
      ? Object.fromEntries(
          pair
            .filter(({ local }) => local.endsWith('_generic'))
            .map(({ local, source }) => [
              kebabCase(local.replace(/_generic$/, '')),
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
        usingComponents,
        componentGenerics,
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

  return {
    config: configs.length > 1 ? deepMerge(...configs) : configs[0] || {},
  };
}
