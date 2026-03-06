<template>
    <view data-alt="home-page" class="home">
        <text data-alt="welcome-text">欢迎使用 uni-app</text>
    </view>
</template>

<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'

onLoad(() => {
    console.log('首页加载')
})
</script>

<style>
.home {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
}
</style>
