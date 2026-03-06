
import {
  defineConfig,
  presetAttributify,
  transformerVariantGroup,
  transformerDirectives,
} from "unocss";
import {presetWeapp} from "unocss-preset-weapp";
import {
  extractorAttributify,
  transformerClass,
} from "unocss-preset-weapp/transformer";

const { presetWeappAttributify, transformerAttributify } =
  extractorAttributify();
export default defineConfig({

  presets: [
    presetWeapp({
      platform: "uniapp",
      isH5: false,
      /** 设置为 false，使 w-* 和 h-* 按照 Tailwind 规则转换为 rpx
       * 例如：h-11 (2.75rem = 44px) 会转换为 88rpx (标准转换：1px = 2rpx)
       * 如果为 true，则 h-11 会直接变成 11rpx
       *
       * 注意：如果期望 h-11 = 44rpx (1:1 转换)，可能需要自定义规则
       */
      whRpx: false,
    }) as any, // 平台配置 - 使用 any 解决版本兼容性问题
    presetWeappAttributify() as any, // Attributify 自动补全 - 使用 any 解决版本兼容性问题
    // presetAttributify(),
    // presetWind4(),
  ],
  transformers: [
    transformerVariantGroup(),
    transformerDirectives(),
    transformerAttributify() as any, // 属性转换 - 使用 any 解决版本兼容性问题
    transformerClass() as any, // class 转换 - 使用 any 解决版本兼容性问题
  ],
  safelist: [
    "border-research",
    "border-pptx",
    "border-excel",
    "border-general",
    "border-code",
    "border-edit",
    "border-neutral-border",
    "border-primary",
    "text-primary",
    "bg-primary-dis",
    "!bg-primary-dis",
  ],
});
