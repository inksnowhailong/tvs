<script setup lang="ts">
const router = useRouter()
</script>

<template>
  <div class="ErrorPage">
    <div class="result-container">
      <div class="status">404</div>
      <div class="title">资源不存在</div>
      <button class="btn" @click="router.push('/')">返回首页</button>
    </div>
  </div>
</template>

<style scoped lang="less">
.ErrorPage {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.result-container {
  text-align: center;
  .status {
    font-size: 72px;
    font-weight: bold;
    color: #999;
  }
  .title {
    font-size: 20px;
    margin: 16px 0 24px;
    color: #666;
  }
  .btn {
    padding: 8px 24px;
    background: #18a058;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background: #36ad6a;
    }
  }
}
</style>
