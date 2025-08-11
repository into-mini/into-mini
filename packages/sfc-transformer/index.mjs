import generate from '@babel/generator';

import {
  babelParse,
  compileScript,
  parse as parseSFC,
} from '@vue/compiler-sfc';

import { action } from './action.mjs';
import { mergeConfig } from './merge-config.mjs';
import { transformer } from './transformer.mjs';

export function parse(raw, { tagMatcher } = {}) {
  const { descriptor } = parseSFC(raw, {
    sourceMap: false,
    templateParseOptions: { comments: false },
  });

  if (descriptor.template) {
    const { tpl, tags } = action(descriptor.template, { tagMatcher });
    descriptor.tpl = tpl;
    descriptor.tags = tags;
  }

  descriptor.tpl ||= '<!-- -->';

  if (!descriptor.scriptSetup && !descriptor.script?.content) {
    descriptor.code = '';

    descriptor.config = mergeConfig(descriptor);

    return descriptor;
  }

  const id = '$$mainBlock';

  if (
    descriptor.scriptSetup ||
    descriptor.script.content.includes('export default ')
  ) {
    const result = compileScript(descriptor, {
      id,
      sourceMap: false,
      genDefaultAs: id,
    });

    const Generics = result.scriptSetupAst
      ? result.scriptSetupAst
          .filter(
            (item) =>
              item.type === 'ImportDeclaration' &&
              item.attributes?.length > 0 &&
              item.attributes.some(
                (attribute) =>
                  attribute.type === 'ImportAttribute' &&
                  attribute.key.name === 'as' &&
                  attribute.value.type === 'StringLiteral' &&
                  attribute.value.value === 'generic',
              ),
          )
          .map((item) => item.source.value)
      : [];

    const pairs = result.imports
      ? Object.values(result.imports)
          .filter(
            ({ imported, isFromSetup, isType, source }) =>
              !isType &&
              isFromSetup &&
              imported === 'default' &&
              source.endsWith('.vue'),
          )
          .map(({ source, local }) => ({
            local,
            source,
            generic: Generics.includes(source),
          }))
      : [];

    descriptor.pairs = pairs;

    const ast = babelParse(result.content, {
      sourceType: 'module',
    });

    const names = pairs.map(({ local }) => local);

    const isSetup =
      result.scriptSetupAst &&
      result.scriptSetupAst.some(
        (item) =>
          item.type !== 'ImportDeclaration' ||
          (item.type === 'ImportDeclaration' &&
            item.source?.value?.endsWith('.vue')),
      );

    transformer(ast, names, id, isSetup);

    const { code } = generate.default(ast);

    descriptor.code = code;

    descriptor.config = mergeConfig(descriptor);

    return descriptor;
  }

  descriptor.code = descriptor.script.content;

  descriptor.config = mergeConfig(descriptor);

  return descriptor;
}
