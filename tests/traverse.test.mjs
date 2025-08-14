import { readFileSync } from 'node:fs';

import { traverse } from '@into-mini/sfc-template-traverse';
import { pretty } from '@into-mini/wxml-loader/pretty.mjs';
import { serializeTemplate } from '@padcom/vue-ast-serializer';
import test from 'ava';
import { createPatch } from 'diff';
import { stringify } from 'javascript-stringify';
import { format } from 'prettier';

import { parse } from '@vue/compiler-sfc';

import * as plugin from './helper/prettier.mjs';

function serialize(ast) {
  return `${pretty(serializeTemplate({ ast }))}\n`;
}

async function jsStringify(ast) {
  const io = await format(`export default ${stringify(ast, null, 2)}`, {
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

function compare(name, oldOne, newOne) {
  return createPatch(name, oldOne, newOne, 'original', 'traversed', {
    ignoreWhitespace: true,
    stripTrailingCr: true,
  });
}

test('traverse', async (t) => {
  const { ast } = parse(vueString).descriptor.template;

  const clone = structuredClone(ast);

  const clone2 = structuredClone(ast);

  traverse(clone);

  t.snapshot(
    compare(
      'ast', //
      await jsStringify(ast),
      await jsStringify(clone),
    ),
  );

  traverse(clone2, {
    TEXT(node) {
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
