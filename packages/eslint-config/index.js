import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier/recommended'
import globals from 'globals'

/** @type {import('eslint').Linter.Config[]} */
export const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      'no-console': 'warn',
    },
  },
  {
    ignores: ['dist', 'node_modules', '.wrangler', '.turbo'],
  },
]

export default baseConfig
