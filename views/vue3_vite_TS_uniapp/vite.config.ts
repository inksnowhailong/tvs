import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'node:url'
import UnoCSS from 'unocss/vite'
// import Icons from "unplugin-icons/vite";
// import { FileSystemIconLoader } from "unplugin-icons/loaders";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    uni['default'](),
    UnoCSS(),
    AutoImport({
      imports: ['vue', 'pinia'],
      dts: 'src/auto-imports.d.ts'
    }) as any,
    // Icons({
    //   compiler: 'vue3',
    //   customCollections: {
    //     custom: FileSystemIconLoader('./src/assets/icons')
    //   }
    // })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 1125,
    open: false,
    cors: true
  },
  build: {
    sourcemap: false, // 你的 tsconfig 已 false
    rollupOptions: {
      external: (id) => {
        // 将所有 ~icons 相关的导入设为外部依赖，避免打包
        if (id.includes('~icons/') || id.includes('unplugin-icons')) {
          return true
        }
        if (['markdown-it', 'vdirs'].includes(id)) {
          return true
        }
      }
    }
  }
})
