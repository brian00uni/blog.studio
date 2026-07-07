import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

// 네이버 그린 기반 brand 팔레트 + 시맨틱 토큰.
// 이걸 정의하면 컴포넌트에서 colorPalette="brand" 로 일관되게 쓸 수 있다.
const config = defineConfig({
  globalCss: {
    body: {
      fontFamily:
        "-apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Malgun Gothic', '맑은 고딕', sans-serif",
      bg: "gray.50",
    },
  },
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: "#e6f9ef" },
          100: { value: "#c1efd6" },
          200: { value: "#98e4bb" },
          300: { value: "#6ed9a0" },
          400: { value: "#45cf85" },
          500: { value: "#03c75a" }, // 네이버 그린
          600: { value: "#02b44e" },
          700: { value: "#029240" },
          800: { value: "#016f31" },
          900: { value: "#004d22" },
          950: { value: "#002b13" },
        },
      },
    },
    semanticTokens: {
      colors: {
        brand: {
          solid: { value: "{colors.brand.500}" },
          contrast: { value: "white" },
          fg: { value: "{colors.brand.700}" },
          muted: { value: "{colors.brand.100}" },
          subtle: { value: "{colors.brand.50}" },
          emphasized: { value: "{colors.brand.300}" },
          focusRing: { value: "{colors.brand.500}" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
