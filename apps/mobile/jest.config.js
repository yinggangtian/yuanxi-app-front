/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
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
