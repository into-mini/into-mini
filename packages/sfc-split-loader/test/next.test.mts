import test from 'ava';
import { transformer } from '../src/transformer.mts';
import { input } from './fixtures/input.mts';

import { format } from 'prettier';

async function formatVue(code: string) {
  return format(code, {
    parser: 'vue',
    htmlWhitespaceSensitivity: 'ignore',
  });
}

test('next', async (t) => {
  const result = transformer(input, {
    preserveTap: (tag: string) => tag === 't-button',
    tagMatcher: (tag: string) =>
      tag === 't-button'
        ? { tag: 't-button', path: '@tencent/tdesign-vue/button' }
        : undefined,
  });

  t.snapshot(await formatVue(result));
});
