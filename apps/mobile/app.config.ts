import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * 元息 App —— Expo 应用配置。
 *
 * 权限文案直接影响应用商店审核（设计文档 §5.5.4 / §8），
 * 请勿改成泛泛而谈的描述。
 */
const BUNDLE_ID = 'com.yuanxi.health';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '元息',
  slug: 'yuanxi',
  scheme: 'yuanxi',
  version: '0.1.0',
  orientation: 'portrait',
  // New Architecture 在 SDK 57 已默认开启，无需显式声明
  userInterfaceStyle: 'automatic',
  assetBundlePatterns: ['**/*'],

  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: false,
    // 微信 SDK 需要（§5.7）
    infoPlist: {
      LSApplicationQueriesSchemes: ['weixin', 'weixinULAPI', 'weixinURLParamsAPI'],
      NSBluetoothAlwaysUsageDescription:
        '元息需要使用蓝牙连接你的脉搏环，以完成设备绑定与脉诊数据采集。我们不会通过蓝牙收集与健康监测无关的信息。',
      NSCameraUsageDescription: '元息需要使用相机扫描设备包装上的二维码，帮助你快速添加脉搏环。',
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: BUNDLE_ID,
    permissions: [
      // Android 12+ —— 明确声明不通过蓝牙推断位置（§5.5.4）
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.BLUETOOTH_CONNECT',
      // Android ≤ 11 扫描 BLE 的前置条件
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.CAMERA',
      'android.permission.INTERNET',
    ],
  },

  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-camera',
      {
        cameraPermission: '元息需要使用相机扫描设备包装上的二维码，帮助你快速添加脉搏环。',
        recordAudioAndroid: false,
      },
    ],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F5F7F9',
        dark: { backgroundColor: '#0A1217' },
        resizeMode: 'contain',
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
    reactCompiler: false,
  },

  extra: {
    // 运行时可覆盖；默认指向联调环境
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.yuanxi.example.com',
  },
});
