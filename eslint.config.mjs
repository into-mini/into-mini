import base from '@nice-move/all-in-base/eslint';

export default [
  ...base,
  {
    ignores: ['src/**', 'tests/fixtures/*'],
  },
];
