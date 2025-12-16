import { parse as parseSFC } from '@vue/compiler-sfc';
import { pretty } from '@into-mini/wxml-loader/pretty.mjs';
import test from 'ava';
import { readFileSync } from 'node:fs';
import { action } from '@into-mini/sfc-transformer/src/action.mjs';

const fixtures = readFileSync(
  new URL('./fixtures/sample2.vue', import.meta.url),
  'utf8',
)
  .trim()
  .replace(/<template root>([\s\S]+)<\/template>$/, '$1')
  .split('<!---->')
  .map((content) => ['<template>', content, '</template>'].join('\n'));

function parse(raw: string) {
  const { descriptor } = parseSFC(raw, {
    sourceMap: false,
    templateParseOptions: { comments: false },
  });

  return action(descriptor.template);
}

for (const [idx, fixture] of Object.entries(fixtures)) {
  test(idx, async (t) => {
    const io = parse(fixture);

    t.snapshot(pretty(io.tpl));
  });
}
