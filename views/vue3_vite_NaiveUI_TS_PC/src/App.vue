<template>
  <NLoadingBarProvider>
    <LoadingContent />
    <NDialogProvider>
      <NMessageProvider>
        <MessageContent />
        <router-view></router-view>
      </NMessageProvider>
    </NDialogProvider>
  </NLoadingBarProvider>
</template>

<script setup lang="ts">
import LoadingContent from '@/common/LoadingContent.vue'
import MessageContent from '@/common/MessageContent/MessageContent.vue'
import { NDialogProvider, NLoadingBarProvider, NMessageProvider } from 'naive-ui'
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
