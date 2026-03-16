import { defineConfig, presetAttributify, presetWind4, transformerDirectives, transformerVariantGroup } from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      primary: 'rgb(255, 123, 32)'
    },
    breakpoints: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px'
    }
  },
  presets: [
    presetWind4(),
    presetAttributify()
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup()
  ],
  shortcuts: {
    'safe-top': 'pt-[env(safe-area-inset-top)]',
    'safe-bottom': 'pb-[env(safe-area-inset-bottom)]',
    'safe-left': 'pl-[env(safe-area-inset-left)]',
    'safe-right': 'pr-[env(safe-area-inset-right)]',
    'safe-x': 'safe-left safe-right',
    'safe-y': 'safe-top safe-bottom',
    'safe-area': 'safe-top safe-bottom safe-left safe-right',
    'touch-action-none': 'touch-none',
    'active-opacity': 'active:opacity-70 transition-opacity'
  },
  rules: [
    ['tap-highlight-transparent', { '-webkit-tap-highlight-color': 'transparent' }],
    ['overscroll-none', { 'overscroll-behavior': 'none' }]
  ]
})
