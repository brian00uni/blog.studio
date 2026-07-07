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
          50: { value: "#fffbeb" },
          100: { value: "#fef3c7" },
          200: { value: "#fde68a" },
          300: { value: "#fcd34d" },
          400: { value: "#fbbf24" }, // 엠버 (네온 액센트)
          500: { value: "#f59e0b" }, // 엠버 옐로우 (주색)
          600: { value: "#d97706" },
          700: { value: "#b45309" },
          800: { value: "#92400e" },
          900: { value: "#78350f" },
          950: { value: "#451a03" },
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
