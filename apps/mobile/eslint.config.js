// @ts-check
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/**
 * 分层依赖边界（设计文档 §5.2）：
 *
 *   app/  ──►  features/  ──►  ui/ , api/ , lib/
 *   features/A  ✗──►  features/B/内部文件（只能经 features/B/index.ts）
 *   ui/  ✗──►  features/ , api/
 */
module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*', 'node_modules/*'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'import/order': [
        'warn',
        {
          groups: [['builtin', 'external'], 'internal', ['parent', 'sibling', 'index']],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // ui/ 是无业务依赖的设计系统
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/api/*', '@/stores/*', '../../features/*', '../../api/*'],
              message: 'ui/ 属于设计系统，不得依赖 features/ / api/ / stores/（设计文档 §5.2）。',
            },
          ],
        },
      ],
    },
  },

  // feature 之间只能经对方的 index.ts 通信
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*'],
              message:
                '跨 feature 只能引用对方的公共出口：import { X } from "@/features/<name>"（设计文档 §5.2）。',
            },
          ],
        },
      ],
    },
  },

  // app/ 只做路由与页面装配
  {
    files: ['app/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*', '@/api/client*'],
              message:
                'app/ 只装配页面：请通过 feature 的公共出口或 hooks 访问业务逻辑（设计文档 §5.2）。',
            },
          ],
        },
      ],
    },
  },

  // 测试与配置文件放宽
  {
    files: ['**/__tests__/**/*.{ts,tsx}', '**/*.test.{ts,tsx}', '*.config.{js,ts}', 'jest.setup.js'],
    rules: {
      'no-restricted-imports': 'off',
      'no-console': 'off',
    },
  },
]);
