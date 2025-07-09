import generate from '@babel/generator';

import {
  babelParse,
  compileScript,
  parse as parseSFC,
} from '@vue/compiler-sfc';

import { action } from './action.mjs';
import { mergeConfig } from './merge-config.mjs';
import { transformer } from './transformer.mjs';

export function parse(raw) {
  const { descriptor } = parseSFC(raw, {
    sourceMap: false,
    templateParseOptions: { comments: false },
  });

  descriptor.tpl = descriptor.template
    ? action(descriptor.template).tpl
    : '<!-- -->';

  if (!descriptor.scriptSetup && !descriptor.script?.content) {
    descriptor.code = '';

    descriptor.config = mergeConfig(descriptor.customBlocks);

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

    const pair = result.imports
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

    descriptor.pair = pair;

    const ast = babelParse(result.content, {
      sourceType: 'module',
      plugins: ['importAttributes'],
    });

    const names = pair.map(({ local }) => local);

    const isSetup =
      result.scriptSetupAst &&
      result.scriptSetupAst.some(
        (item) =>
          item.type !== 'ImportDeclaration' ||
          (item.type === 'ImportDeclaration' &&
            item.source?.value?.endsWith('.vue')),
      );

    transformer(ast, names, id, isSetup);

    const { code } = generate.default(ast, { importAttributesKeyword: 'with' });

    descriptor.code = code;

    descriptor.config = mergeConfig(descriptor.customBlocks, pair);

    return descriptor;
  }

  descriptor.code = descriptor.script.content;

  descriptor.config = mergeConfig(descriptor.customBlocks);

  return descriptor;
}
