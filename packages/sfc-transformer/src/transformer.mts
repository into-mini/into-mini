import {
  babelParse,
  compileScript,
  parse as parseSFC,
} from '@vue/compiler-sfc';
import type { SFCDescriptor, SFCParseResult } from '@vue/compiler-sfc';
import { generate } from '@babel/generator';
import { transformTemplateAst } from './action.mjs';
import { stringify } from '@padcom/vue-ast-serializer';

import yaml from 'yaml';
import { deepmerge } from 'deepmerge-ts';
import { transformerJS } from './transformer-js.mts';
import { kebabCase } from 'change-case';

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

type Pairs = {
  local: string;
  source: string;
  generic: boolean;
}[];

function replaceConfig(
  result: SFCParseResult,
  {
    tags = new Map(),
    pairs = [],
  }: {
    tags?: Map<any, any>;
    pairs?: Pairs;
  },
) {
  const exists = result.descriptor.customBlocks
    .filter(
      (customBlock) =>
        customBlock.type === 'config' &&
        customBlock.content?.trim() &&
        (customBlock.lang === 'yaml' || customBlock.lang === 'json'),
    )
    .map((customBlock) => {
      if (customBlock.lang === 'yaml') {
        return yaml.parse(customBlock.content);
      }

      return JSON.parse(customBlock.content);
    });

  exists.push({ component: true });

  for (const { local, source } of pairs.filter(({ generic }) => !generic)) {
    tags.set(kebabCase(local), source);
  }

  if (tags.size > 0) {
    exists.push({ usingComponents: Object.fromEntries(tags) });
  }

  const componentGenerics =
    pairs.length > 0
      ? new Map(
          pairs
            .filter(({ generic }) => generic)
            .map(({ local, source }) => [
              kebabCase(local),
              { default: source },
            ]),
        )
      : undefined;

  if (componentGenerics?.size) {
    exists.push({
      componentGenerics: Object.fromEntries(componentGenerics),
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
}

function getGeneric(
  result: SFCParseResult,
  id: string,
): {
  pairs: Pairs;
  script: string;
} {
  const script = compileScript(result.descriptor, {
    id,
    sourceMap: false,
    genDefaultAs: id,
  });

  const Generics = script.scriptSetupAst
    ? script.scriptSetupAst
        .filter(
          (item) =>
            item.type === 'ImportDeclaration' &&
            item.attributes?.length &&
            item.attributes.some(
              (attribute) =>
                attribute.type === 'ImportAttribute' &&
                'name' in attribute.key &&
                attribute.key.name === 'as' &&
                attribute.value.type === 'StringLiteral' &&
                attribute.value.value === 'generic',
            ),
        )
        .map((item) => 'source' in item && item.source?.value)
    : [];

  const pairs = script.imports
    ? Object.values(script.imports)
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

  return {
    pairs,
    script: script.content.replace('const $$mainBlock = {}', ''),
  };
}

const scriptID = '$$mainBlock';

function getScript(code: string): SFCDescriptor['script'] {
  return parseSFC(`<script>${code}</script>`, {
    sourceMap: false,
    templateParseOptions: { comments: false },
  }).descriptor.script;
}

function getTemplate(code: string): SFCDescriptor['template'] {
  return parseSFC(`<template>${code}</template>`, {
    sourceMap: false,
    templateParseOptions: { comments: true },
  }).descriptor.template;
}

export function transformer(
  sourceInput: string,
  { tagMatcher, preserveTap }: Options = {},
) {
  const result = parseSFC(sourceInput, {
    sourceMap: false,
    templateParseOptions: { comments: false },
  });

  let tags: Map<string, any> | undefined;

  if (result.descriptor.template?.ast?.children.length) {
    tags = transformTemplateAst(result.descriptor.template.ast, {
      tagMatcher,
      preserveTap,
    }).tags;
  } else {
    result.descriptor.template = getTemplate('<!-- -->');
  }

  if (
    result.descriptor.script?.content?.trim() ||
    result.descriptor.scriptSetup?.content?.trim()
  ) {
    const { pairs, script } = getGeneric(result, scriptID);

    replaceConfig(result, { tags, pairs });

    const ast = babelParse(script, { sourceType: 'module' });

    const names = pairs.map(({ local }) => local);

    transformerJS(ast, names, scriptID);

    const { code } = generate(ast);

    result.descriptor.script = getScript(code);
  } else {
    result.descriptor.script = getScript('Component({});');

    replaceConfig(result, { tags });
  }

  if (result.descriptor.scriptSetup) {
    result.descriptor.scriptSetup = null;
  }

  return stringify(result);
}
