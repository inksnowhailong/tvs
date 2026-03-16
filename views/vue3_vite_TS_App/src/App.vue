<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { mainStore } from './store/modules/mainStore'
const URLThemeName = new URLSearchParams(window.location.search).get('theme')
if (URLThemeName && ['light', 'dark'].includes(URLThemeName)) {
  mainStore.theme = URLThemeName as 'light' | 'dark'
}
provide(
  'themeName',
  computed(() => mainStore.theme)
)

defineOptions()
</script>

<style lang="less">
html,
body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
#app {
  font-family: MicrosoftYaHeiUI;
  width: 100%;
  height: 100%;
  min-width: 1200px;
  position: relative;
}

</style>
