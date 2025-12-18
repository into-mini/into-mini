import test from 'ava';
import { transformer } from '../src/transformer.mts';

import { format } from 'prettier';
// eslint-disable-next-line import/no-extraneous-dependencies
import { getFixtureFiles } from 'into-mini-test/fixtures/index.mts';

async function formatVue(code: string) {
  return format(code, {
    parser: 'vue',
    htmlWhitespaceSensitivity: 'ignore',
  });
}

const fixtures = getFixtureFiles();

for (const [name, fixture] of Object.entries(fixtures)) {
  test(name, async (t) => {
    const result = transformer(fixture, {
      preserveTap: (tag: string) => tag === 't-button',
      tagMatcher: (tag: string) =>
        tag === 't-button'
          ? { tag: 't-button', path: '@tencent/tdesign-vue/button' }
          : undefined,
    });

    t.snapshot(fixture, 'input');
    t.snapshot(await formatVue(result), 'output');
  });
}
