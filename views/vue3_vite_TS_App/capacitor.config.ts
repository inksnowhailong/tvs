import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'vue3-vite-ts-app',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: false, // WebView 不盖在状态栏上
      style: 'LIGHT', // 状态栏图标深色（根据你的主题改 LIGHT/LIGHT）
      backgroundColor: '#ffffffff' // 状态栏背景色，和你的页面背景保持一致
    },
    Keyboard: {
      resize: 'body', // 键盘弹出时自动推起页面
      style: 'LIGHT',
      resizeOnFullScreen: true
    }
  },
  server: {
    androidScheme: 'https'
  },
   // Android 专属（iOS 不用写这一段也行）
  android: {
    // 允许透明状态栏 + 自动 padding
    backgroundColor: '#ffffffff'
  },

  // iOS 专属（自动处理刘海/Home Indicator）
  ios: {
    contentInset: 'automatic', // iOS 16+ 必加
  }
}

export default config
