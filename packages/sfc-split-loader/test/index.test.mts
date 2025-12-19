import test from 'ava';

// eslint-disable-next-line import/no-extraneous-dependencies
import { getFixtureFiles } from 'into-mini-test/fixtures/index.mts';
import { runLoader } from './helper/loader.mts';

// 获取所有fixture文件
const fixtureFiles = getFixtureFiles();

for (const [path, file] of Object.entries(fixtureFiles)) {
  test(path, async (t) => {
    // 运行loader
    const result = await runLoader(path, file, {
      preserveTap: (tag: string) => tag === 't-button',
      tagMatcher: (tag: string) =>
        tag === 't-button'
          ? { tag: 't-button', path: '@tencent/tdesign-vue/button' }
          : undefined,
    });

    // 验证结果
    t.truthy(result, 'Loader should return a result');
    t.is(Array.isArray(result), true, 'Result should be an array');

    // 将结果数组转换为字符串
    const output = result.join('');

    t.is(typeof output, 'string', 'Output should be a string');

    // 快照测试
    t.snapshot(output, 'imports');
  });
}
