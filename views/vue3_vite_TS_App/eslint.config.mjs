import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  // 只检查 TS / TSX / Vue 文件，避免把构建产物或其他文件纳入 lint
  {
    files: ['**/*.{ts,mts,tsx,vue}']
  },

  // 忽略目录：减少无意义扫描，也避免 lint 生成文件
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/dist-ssr/**', '**/.vite/**', '**/coverage/**', '**/*.d.ts']
  },

  // Vue 官方推荐规则（flat 版本）
  pluginVue.configs['flat/recommended'],

  // Vue + TypeScript 推荐规则（包含 parser 和 TS 基础规则）
  vueTsConfigs.recommended,

  // 项目级覆盖：按“能跑 + 不过度约束”来放宽部分规则
  {
    rules: {
      // 允许 console/debugger，便于开发排查
      'no-console': 'off',
      'no-debugger': 'off',

      // 仍保留的基础约束：禁用 var，优先 const
      'no-var': 'error',
      'prefer-const': 'warn',

      // 关闭基础 JS 同类规则，交给 TS 体系处理（避免重复报错）
      'no-unused-vars': 'off',
      'no-undef': 'off',

      // TS 放宽项：减少历史代码迁移成本
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',

      // Vue 风格放宽项：不强制组件名/属性顺序/连字符事件命名
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/attributes-order': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/v-on-event-hyphenation': 'off'
    }
  },

  // 关闭与 Prettier 冲突的格式化类规则（必须放在后面）
  skipFormatting
)
