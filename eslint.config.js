import { defineConfig, globalIgnores } from 'eslint/config'
import typescriptEslint from '@typescript-eslint/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
})

export default defineConfig([
  globalIgnores([
    '**/dist/',
    '**/node_modules',
    '**/scripts',
    '**/examples',
    '**/.next',
    '**/next.config.js',
    'eslint.config.mjs',
    'playwright.config.js',
    'jest.config.js',
    'jest.config.build.js'
  ]),
  {
    extends: compat.extends(
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier',
      'plugin:jest-dom/recommended',
      'plugin:testing-library/react',
      'plugin:react/jsx-runtime'
    ),
    plugins: {
      '@typescript-eslint': typescriptEslint,
      'react-hooks': reactHooks
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      },
      parser: tsParser,
      ecmaVersion: 8,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          impliedStrict: true,
          experimentalObjectRestSpread: true
        },
        allowImportExportEverywhere: true,
        project: ['**/tsconfig.json']
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      'func-names': [2, 'as-needed'],
      'no-shadow': 0,
      '@typescript-eslint/no-shadow': 2,
      '@typescript-eslint/explicit-function-return-type': 0,
      '@typescript-eslint/no-unused-vars': [
        0,
        {
          argsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-use-before-define': 0,
      '@typescript-eslint/ban-ts-ignore': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/ban-ts-comment': 0,
      '@typescript-eslint/no-var-requires': 0,
      '@typescript-eslint/no-explicit-any': 0,
      '@typescript-eslint/explicit-module-boundary-types': 0,
      '@typescript-eslint/consistent-type-imports': [
        2,
        {
          prefer: 'type-imports'
        }
      ],
      '@typescript-eslint/ban-types': 0,
      'react-hooks/rules-of-hooks': 2,
      'react-hooks/exhaustive-deps': 1,
      'react/prop-types': 0,
      'testing-library/no-unnecessary-act': 0
    }
  },
  {
    files: ['e2e/**/*.ts'],
    rules: {
      'testing-library/prefer-screen-queries': 'off'
    }
  }
])
