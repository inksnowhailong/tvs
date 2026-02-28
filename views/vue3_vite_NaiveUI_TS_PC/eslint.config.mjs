// eslint.config.mjs
import { defineConfigWithVueTs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  // 使用 vue 的 recommended（平衡，不太严格）
  // 如果你想更宽松，可以换成 pluginVue.configs['flat/essential']
  pluginVue.configs['flat/recommended'],

  // 包含 typescript-eslint 的 recommended + vue parser 处理
  // 如果你不需要 type-aware 规则，可以不加 vueTsConfigs.strict 等

  // 全局忽略（基于你原来的 ignores，做了精简和常见补充）
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/dist-ssr/**',
      '**/.vite/**',
      '**/coverage/**',
      '**/*.local',
      '**/*.log',
      '**/.DS_Store',
      '**/.vscode/**',
      '**/.idea/**',
      '**/package-lock.json',
      '**/pnpm-lock.yaml',
      '**/yarn.lock',
      '**/*.d.ts',           // 自动生成的类型文件
      '**/auto-import.d.ts',
      '**/components.d.ts',
      '**/.eslintcache',
      // 如果有其他项目特定忽略，可以继续加
    ],
  },

  // 关闭 prettier 与 eslint 冲突的规则（必须放较后）
  skipFormatting,

  {
    rules: {
      // 基础 JS 规则 - 大部分 off 或 warn
      'no-console': 'off',
      'no-debugger': 'off',
      'no-var': 'error',                // 还是建议用 let/const
      'prefer-const': 'warn',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'max-len': 'off',
      'arrow-parens': 'off',
      'comma-dangle': 'off',
      'quotes': 'off',
      'semi': 'off',

      // TypeScript 规则 - 宽松版
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', {
        varsIgnorePattern: '^_',      // _ 开头的变量忽略（常见 hack）
        args: 'none',                 // 函数参数不强制使用
        caughtErrors: 'none',
      }],
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',

      // Vue 规则 - 关闭大部分风格限制
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/attributes-order': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off',
      'vue/require-default-prop': 'off',
      'vue/comment-directive': 'off',

    },
  },

  // 测试文件特殊处理（如果你有 jest/vitest 等）
  {
    files: [
      '**/__tests__/*.{j,t}s?(x)',
      '**/*.spec.{j,t}s?(x)',
      '**/*.test.{j,t}s?(x)',
    ],
    languageOptions: {
      globals: {
        // ...globals.jest,   // 如果用 jest
        vi: 'readonly',     // 如果用 vitest，可以加 vi, describe 等
      },
    },
  }
)
