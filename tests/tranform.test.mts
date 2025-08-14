import { parse as parseSFC } from '@vue/compiler-sfc';
import { pretty } from '@into-mini/wxml-loader/pretty.mjs';
import test from 'ava';
import { readFileSync } from 'node:fs';
import { action } from '@into-mini/sfc-transformer/action.mjs';

const fixture = readFileSync(
  new URL('./fixtures/sample2.vue', import.meta.url),
  'utf8',
);

function parse(raw: string) {
  const { descriptor } = parseSFC(raw, {
    sourceMap: false,
    templateParseOptions: { comments: false },
  });

  return action(descriptor.template);
}

test('vue', async (t) => {
  const io = parse(fixture);
  t.snapshot(io.ast.children[2].props);
  t.snapshot(pretty(io.tpl));
});

test('vue2', async (t) => {
  const io = parse(fixture);
  t.snapshot(io.ast.children[2].props);
  t.snapshot(pretty(io.tpl));
});
