<template>
  <router-view></router-view>
</template>

<script setup lang="ts">
import { useVueStore } from '@tvs/store-adapters/vue'
import { mainStore } from './adapters/store/mainStore'

const main = useVueStore(mainStore)
const URLThemeName = new URLSearchParams(window.location.search).get('theme')
if (URLThemeName && ['light', 'dark'].includes(URLThemeName)) {
  main.theme.value = URLThemeName as 'light' | 'dark'
}
provide(
  'themeName',
  computed(() => main.theme.value)
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
