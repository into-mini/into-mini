import { parse as parseSFC } from '@vue/compiler-sfc';

import { action } from './action.mjs';

export function parse(raw) {
  const { descriptor } = parseSFC(raw, {
    sourceMap: false,
    templateParseOptions: { comments: false },
  });

  const { tpl } = action(descriptor.template);
  descriptor.tpl = tpl;

  descriptor.code = descriptor.script?.content;

  descriptor.config =
    descriptor.customBlocks
      .find((block) => block.type === 'config')
      ?.content.trim() || {};

  return descriptor;
}
