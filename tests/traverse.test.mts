/* eslint-disable no-param-reassign */
import { readFileSync } from 'node:fs';

import { traverse } from '@into-mini/sfc-template-traverse';
import { pretty } from '@into-mini/wxml-loader/pretty.mjs';
import { serializeTemplate } from '@padcom/vue-ast-serializer';
import test from 'ava';
import { createPatch } from 'diff';
import { stringify } from 'javascript-stringify';
import { format } from 'prettier';

import { parse } from '@vue/compiler-sfc';
import type { SFCTemplateBlock } from '@vue/compiler-sfc';

import * as plugin from './helper/prettier.mts';

function serialize(block: SFCTemplateBlock | null) {
  return block ? `${pretty(serializeTemplate(block))}\n` : '';
}

async function jsStringify(block: SFCTemplateBlock | null) {
  if (!block) {
    return '';
  }

  const io = await format(`export default ${stringify(block.ast, null, 2)}`, {
    parser: 'babel',
    trailingComma: 'all',
    plugins: [plugin],
  });

  return io.replace(/^export\sdefault\s/, '');
}

const vueString = readFileSync(
  new URL('./fixtures/sample.vue', import.meta.url),
  'utf8',
);

function compare(name: string, oldOne: string, newOne: string) {
  return createPatch(name, oldOne, newOne, 'original', 'traversed', {
    ignoreWhitespace: true,
    stripTrailingCr: true,
  });
}

test('traverse', async (t) => {
  const block = parse(vueString).descriptor.template;

  const clone = structuredClone(block);

  const clone2 = structuredClone(block);

  traverse(clone);

  t.snapshot(
    compare(
      'ast', //
      await jsStringify(block),
      await jsStringify(clone),
    ),
  );

  traverse(clone2, {
    TEXT(node: { content: string }) {
      node.content = `${node.content.toUpperCase()}6`;
    },
  });

  t.snapshot(
    compare(
      'ast', //
      await jsStringify(clone),
      await jsStringify(clone2),
    ),
  );

  t.snapshot(
    compare(
      'tpl', //
      serialize(clone),
      serialize(clone2),
    ),
  );
});
