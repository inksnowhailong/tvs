import { Router } from 'vue-router'

/**
 * @description: 注册异常处理层相关内容
 * @param {Router} router
 * @return {*}
 */
export default function (_app: unknown, router: Router) {
  ErrorPage(router)
}

/**
 * @description: 错误页面
 * @param {Router} router
 * @return {*}
 */
const ErrorPage = (router: Router) => {
  // 404页面
  router.addRoute({
    path: '/404',
    name: '404',
    component: () => import('./Result/404.vue'),
    meta: {
      title: '404'
    }
  })
  router.addRoute({
    path: '/403',
    name: '403',
    component: () => import('./Result/403.vue'),
    meta: {
      title: '403'
    }
  })
}
