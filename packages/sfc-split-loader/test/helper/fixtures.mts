import fs from 'node:fs';
import path from 'node:path';

// 获取fixture目录路径
const fixturesDir = path.join(process.cwd(), 'tests/fixtures');

/**
 * 获取所有fixture文件
 * @returns {string[]} fixture文件列表
 */
export function getFixtureFiles() {
  return fs
    .readdirSync(fixturesDir)
    .filter((file) => file.endsWith('.vue'))
    .toSorted();
}

/**
 * 获取fixture文件路径
 * @param {string} fixtureFile fixture文件名
 * @returns {string} fixture文件路径
 */
export function getFixturePath(fixtureFile: string) {
  return path.join(fixturesDir, fixtureFile);
}

/**
 * 读取fixture内容
 * @param {string} fixtureFile fixture文件名
 * @returns {string} fixture内容
 */
export function readFixture(fixtureFile: string) {
  const fixturePath = getFixturePath(fixtureFile);

  return fs.readFileSync(fixturePath, 'utf8');
}

/**
 * 获取fixture目录路径
 * @returns {string} fixture目录路径
 */
export function getFixturesDir() {
  return fixturesDir;
}
