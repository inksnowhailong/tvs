/** 将样式对象转换为 CSS 字符串，供端侧动态样式注入使用。 */
export function styleObjToCss(cssVars: Partial<CSSStyleDeclaration>): string {
    let cssText = ''
    for (const key in cssVars) {
        cssText += `${key}:${cssVars[key]};`
    }
    return cssText
}
