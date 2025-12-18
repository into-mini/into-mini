import { globSync, readFileSync } from 'node:fs';
import path, { join } from 'node:path';

const fixturesDir = path.join(process.cwd(), 'tests/fixtures');

function getFixtureFilePaths() {
  const names = globSync('*.vue', {
    cwd: fixturesDir,
  });

  return Object.fromEntries(
    names.map((name) => [name, join(fixturesDir, name)]),
  );
}

export function getFixtureFiles() {
  const paths = getFixtureFilePaths();

  return Object.fromEntries(
    Object.entries(paths).map(([name, path]) => [
      name,
      readFileSync(path, 'utf-8'),
    ]),
  );
}
