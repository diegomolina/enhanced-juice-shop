// @ts-check
import neostandard from 'neostandard'
import globals from 'globals'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default [
  {
    ignores: [
      'app/private/**',
      'vagrant/**',
      'frontend/**',
      'dist/**',
      'build/**',
      'node_modules/**'
    ]
  },
  ...neostandard({ ts: true }),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
      }
    },
    rules: {
      semi: ['error', 'never'],
      eqeqeq: 'off',
      'no-eval': 'off',
      'no-new-func': 'off',
      'no-loss-of-precision': 'off'
    }
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname
      }
    },
    rules: {
      'no-void': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-for-of': 'off'
    }
  }
]
