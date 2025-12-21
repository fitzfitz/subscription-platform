import repoConfig from '@repo/eslint-config';

export default [
  ...repoConfig,
  {
    ignores: ['dist/**', '.wrangler/**', 'node_modules/**'],
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    }
  }
];
