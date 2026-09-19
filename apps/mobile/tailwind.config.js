/** @type {import('tailwindcss').Config} */
/*
 * Yuanxi Design System —— Tailwind / NativeWind 映射（设计文档 §6.11）。
 *
 * 约定：页面中的 className 只用于布局（flex / gap / padding），
 * 颜色、字号、圆角通过设计系统组件的 props 表达。
 */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        // 语义 token —— 随深浅色自动切换
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--c-surface-raised) / <alpha-value>)',
        'text-primary': 'rgb(var(--c-text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--c-text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--c-text-tertiary) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',

        // 品牌色「息青」
        primary: {
          50: '#EEF9F8',
          100: '#D3F0ED',
          200: '#A6E0DA',
          300: '#6FCBC2',
          400: '#36B3A8',
          500: '#12998E',
          600: '#0B7F76',
          700: '#0A665F',
          900: '#063C38',
        },
        // 中性色「墨」
        ink: {
          50: '#F5F7F9',
          100: '#EEF1F4',
          200: '#E1E6EA',
          300: '#C4CCD3',
          400: '#95A1AB',
          500: '#6B7985',
          700: '#34434E',
          900: '#0E1A22',
        },

        success: '#1E9E64',
        warning: '#D98A1C',
        danger: '#D6453D',
        info: '#2F7FD8',
        // 仅用于价格数字
        price: '#E14B35',
      },
      borderRadius: {
        xs: '6px',
        sm: '10px',
        md: '14px',
        lg: '20px',
        xl: '28px',
        full: '9999px',
      },
      spacing: {
        // 4pt 基准（§6.4）
        0.5: '2px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      fontFamily: {
        num: ['Inter-SemiBold'],
      },
    },
  },
  plugins: [],
};
