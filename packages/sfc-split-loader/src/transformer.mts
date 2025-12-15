import { parse as parseSFC } from '@vue/compiler-sfc';
import { transformTemplateAst } from '@into-mini/sfc-transformer/action.mjs';
import { stringify } from '@padcom/vue-ast-serializer';

import yaml from 'yaml';
import { deepmerge } from 'deepmerge-ts';

export type Options = {
  type?: boolean;
  preserveTap?: (tag: string) => boolean;
  tagMatcher?: (tag: string) =>
    | {
        tag: string;
        path: string;
      }
    | undefined;
};

export function transformer(
  source: string,
  { tagMatcher, preserveTap }: Options = {},
) {
  const result = parseSFC(source, {
    sourceMap: false,
    templateParseOptions: { comments: false },
  });

  if (result.descriptor.template) {
    const { tags } = transformTemplateAst(result.descriptor.template.ast, {
      tagMatcher,
      preserveTap,
    });

    console.log(result.descriptor.customBlocks);

    const exists = result.descriptor.customBlocks
      .filter(
        (customBlock) =>
          customBlock.type === 'config' &&
          customBlock.content.trim() &&
          (customBlock.lang === 'yaml' || customBlock.lang === 'json'),
      )
      .map((customBlock) => {
        if (customBlock.lang === 'yaml') {
          return yaml.parse(customBlock.content);
        }

        return JSON.parse(customBlock.content);
      });

    if (tags.size > 0) {
      exists.push({
        usingComponents: Object.fromEntries(tags.entries()),
      });
    }

    result.descriptor.customBlocks.splice(
      0,
      result.descriptor.customBlocks.length,
      {
        type: 'config',
        content: JSON.stringify(deepmerge(...exists), null, 2),
        lang: 'json',
        attrs: {
          lang: 'json',
        },
        loc: {
          start: {
            line: 0,
            column: 0,
            offset: 0,
          },
          end: {
            line: 0,
            column: 0,
            offset: 0,
          },
          source: '',
        },
      },
    );

    return stringify(result);
  }

  return source;
}
