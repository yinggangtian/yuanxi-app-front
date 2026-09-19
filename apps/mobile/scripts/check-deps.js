#!/usr/bin/env node
/**
 * 校验原生依赖版本与 Expo SDK 的版本表一致。
 *
 * Expo 对原生依赖做**精确锁定**而非 caret 范围：次版本漂移就可能破坏原生
 * 兼容（例如 react-native-reanimated 4.7 要求 react-native-worklets 0.13，
 * 与 SDK 57 锁定的 0.10 冲突）。
 *
 * 由于 api.expo.dev 未必可达，这里直接读取 expo 包内置的 bundledNativeModules.json，
 * 与 `expo install --check` 使用同一份数据。
 */
const map = require('../node_modules/expo/bundledNativeModules.json');
const pkg = require('../package.json');

const declared = { ...pkg.dependencies, ...pkg.devDependencies };
const mismatches = [];

for (const [name, version] of Object.entries(declared)) {
  const expected = map[name];
  if (expected && expected !== version) {
    mismatches.push({ name, version, expected });
  }
}

if (mismatches.length > 0) {
  console.error('以下依赖与 Expo SDK 版本表不一致：\n');
  for (const { name, version, expected } of mismatches) {
    console.error(`  ${name}: 声明 ${version} ，应为 ${expected}`);
  }
  console.error('\n请改为版本表中的精确版本后重新安装。');
  process.exit(1);
}

console.log(`原生依赖版本校验通过（共比对 ${Object.keys(declared).length} 项）。`);
