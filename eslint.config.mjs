import base from '@nice-move/all-in-base/eslint';

export default [
  ...base,
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        getApp: 'readonly',
      },
    },
  },
  {
    ignores: ['src/**', 'fake/**', 'tests/fixtures/*'],
  },
];
