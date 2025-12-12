import test from 'ava';
import {
  getFixtureFiles,
  getFixturePath,
  readFixture,
  runLoader,
} from './helper/index.mts';
import path from 'node:path';

// 获取所有fixture文件
const fixtureFiles = getFixtureFiles();

// 为每个fixture文件创建独立的测试用例
fixtureFiles.forEach((fixtureFile) => {
  test(`Should generate correct imports for ${fixtureFile}`, async (t) => {
    const fixturePath = getFixturePath(fixtureFile);
    const componentName = path.basename(fixtureFile, '.vue');

    // 读取fixture内容
    const source = readFixture(fixtureFile);

    // 运行loader
    const result = await runLoader(fixturePath, source);

    // 验证结果
    t.truthy((result as any).result, 'Loader should return a result');
    t.is(
      Array.isArray((result as any).result),
      true,
      'Result should be an array',
    );

    // 将结果数组转换为字符串
    const output = (result as any).result.join('');
    t.truthy(output, 'Output should not be empty');
    t.is(typeof output, 'string', 'Output should be a string');

    // 快照测试
    t.snapshot(output, `${componentName}-imports`);

    // 验证生成的导入语句数量
    const importStatements = output.match(/import\s+'\./g) || [];
    t.true(
      importStatements.length > 0,
      'Should generate at least one import statement',
    );
  });
});
