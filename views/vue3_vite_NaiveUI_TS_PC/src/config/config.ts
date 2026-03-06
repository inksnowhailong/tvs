
export const config = {
  /**安全防护  前端解决和预防 */
  safe: {
    /**xss防护 */
    xss: {
      /**是否启用csp限制浏览器只加载和执行来自特定来源的脚本  最好在服务端也限制一次csp */
      csp: {
        enable: true,
        'http-equiv': 'Content-Security-Policy',
        // 详细配置请参考 https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Security-Policy/script-src
        /** 允许指定资源内容请求的到  self 代表允许自己同源内容  后续的用空格分开的 是允许的url开头部分*/ //https://opencollective.com 是因为有个插件用到了这个
        content: `default-src 'self' ;
                  img-src 'self' data:;
                  font-src 'self' data: http://at.alicdn.com;
                  style-src 'self' 'unsafe-inline';
                  script-src 'self' https://cdn.bootcdn.net http://cdn.bootcdn.net `
      }
    },
    /**点击劫持或UI红Redressing */
    clickjack: {
      enable: false,
      /**启用防护，只允许指定网页 能够iframe嵌入当前网站 */
      iframeWhitelist: []
    }
  },
  /**可视化配置 */
  visual: {
    /**是否启用 */
    enable: false,
    /**onload后执行一次 */
    onload: true,
    /**onresize后执行一次 一般来说 不用开这个 影响性能，除非有需要 */
    onresize: false,
    /**适应的设备宽高 */
    width: 1200,
    height: 720,
    /**默认是对app节点内进行缩放，如果有节点在app外，就要在这里进行添加，以进行缩放 */
    ortherNodes: [
      {
        select: '.n-modal', // 选择器
        transformOrigin: '0% 0% 0' // 缩放原点 没有这个字段的话，默认也是0% 0% 0 也就是左上，可以自己调整
      }
    ]
  },
  /**移动端 */
  mobile: {
    /**eruda 移动端调试工具 */
    eruda: false // import.meta.env.DEV  只开发环境有效 就用这个
  }
}
