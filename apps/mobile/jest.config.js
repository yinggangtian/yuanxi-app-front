/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  // react-native-worklets 自带的 resolver：跳过 .native.ts 解析，
  // 否则 Reanimated 4 在 Node 环境下会尝试加载原生 worklets 实现而报错
  resolver: '<rootDir>/node_modules/react-native-worklets/jest/resolver.js',
  // Skia 在 Node 环境下没有 JSI 绑定，用官方 jest 替身
  setupFiles: ['<rootDir>/node_modules/@shopify/react-native-skia/jestSetup.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // lucide-react-native 的 "react-native" 导出条件指向 .mjs，Jest 无法按
    // CommonJS 加载；测试环境改用其 CJS 构建（运行时仍走 Metro 的 ESM 解析）
    '^lucide-react-native$': '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|nativewind|react-native-css-interop|@shopify/.*|lucide-react-native)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    // engine / domain 为纯 TS，要求 ≥ 90%（设计文档 §5.12）
    './src/features/measurement/engine/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/features/bluetooth/domain/': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
