export default {
  // 一行最大长度，超出后会自动换行
  printWidth: 150,

  // 缩进宽度：2 空格
  tabWidth: 2,

  // 用空格缩进，不使用 tab
  useTabs: false,

  // 行尾不加分号（与你当前代码风格一致）
  semi: false,

  // 字符串优先单引号
  singleQuote: true,

  // 对象/数组末尾不加逗号
  trailingComma: 'none',

  // 对象字面量保留空格：{ a: 1 }
  bracketSpacing: true,

  // 多行标签时，让 > 紧跟最后一行
  bracketSameLine: true,

  // 箭头函数参数始终保留括号：(x) => x
  arrowParens: 'always',

  // Markdown 文本按 printWidth 自动换行
  proseWrap: 'always',

  // HTML 空白敏感度：忽略（避免模板中因空白触发频繁改动）
  htmlWhitespaceSensitivity: 'ignore',

  // Vue SFC 中 script/style 不额外缩进
  vueIndentScriptAndStyle: false,

  // 行尾符号跟随系统环境（跨平台协作更少冲突）
  endOfLine: 'auto',

  // 插件：CSS 属性排序 + Vue/HTML 属性排序整理
  plugins: ['prettier-plugin-css-order', 'prettier-plugin-organize-attributes']
}
