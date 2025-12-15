import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const input = readFileSync(
  resolve(process.cwd(), 'tests/fixtures/sample2.vue'),
  'utf8',
);
