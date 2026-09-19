/**
 * 演示数据（Mock Fixtures）。
 *
 * 用途：在后端接口就绪前驱动全部页面，并作为 Maestro E2E 的稳定数据源。
 * 接入真实接口时只需替换 `src/features/*//*api` 中 hooks 的 queryFn，
 * 页面与组件无需改动。
 *
 * ⚠️ 全部为虚构数据，不对应任何真实用户或商品。
 */
import type {
  Advice,
  BoundDevice,
  ReportDetail,
  ReportSummary,
  TrendPoint,
  UserProfile,
} from '../api/schemas';

const daysAgo = (days: number, hour = 8, minute = 12): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

export const mockProfile: UserProfile = {
  id: 'u_1001',
  nickname: '林一',
  avatarUrl: null,
  gender: 'female',
  birthYear: 1994,
  heightCm: 165,
  weightKg: 52,
  primaryConstitution: 'qi-stagnation',
  secondaryConstitutions: ['qi-deficiency'],
  points: 1280,
  level: 3,
  levelName: '养息者',
};

export const mockDevice: BoundDevice = {
  id: 'dev_1001',
  bleId: 'mock-device-0001',
  sn: 'YX2026A18F2A',
  model: 'ring-pro',
  name: '脉搏环 Pro',
  firmware: 'v1.2.0',
  latestFirmware: 'v1.3.0',
  boundAt: daysAgo(30),
  lastSyncAt: daysAgo(0),
};

/** 近 7 次评分，用于首页 sparkline（§7.2）。 */
export const mockRecentScores = [78, 81, 79, 83, 80, 83, 86];

export const mockReportSummaries: ReportSummary[] = [
  {
    id: 'rpt_0007',
    measuredAt: daysAgo(0),
    score: 86,
    scoreLevel: '良好',
    pulsePattern: '弦细脉',
    primaryConstitutionLabel: '气郁质',
    deltaFromPrevious: 3,
  },
  {
    id: 'rpt_0006',
    measuredAt: daysAgo(1),
    score: 83,
    scoreLevel: '良好',
    pulsePattern: '弦脉',
    primaryConstitutionLabel: '气郁质',
    deltaFromPrevious: 3,
  },
  {
    id: 'rpt_0005',
    measuredAt: daysAgo(2),
    score: 80,
    scoreLevel: '良好',
    pulsePattern: '细脉',
    primaryConstitutionLabel: '气虚质',
    deltaFromPrevious: -3,
  },
  {
    id: 'rpt_0004',
    measuredAt: daysAgo(3),
    score: 83,
    scoreLevel: '良好',
    pulsePattern: '弦细脉',
    primaryConstitutionLabel: '气郁质',
    deltaFromPrevious: 4,
  },
  {
    id: 'rpt_0003',
    measuredAt: daysAgo(5),
    score: 79,
    scoreLevel: '一般',
    pulsePattern: '沉细脉',
    primaryConstitutionLabel: '气虚质',
    deltaFromPrevious: -2,
  },
  {
    id: 'rpt_0002',
    measuredAt: daysAgo(6),
    score: 81,
    scoreLevel: '良好',
    pulsePattern: '弦脉',
    primaryConstitutionLabel: '气郁质',
    deltaFromPrevious: 3,
  },
  {
    id: 'rpt_0001',
    measuredAt: daysAgo(8),
    score: 78,
    scoreLevel: '一般',
    pulsePattern: '细脉',
    primaryConstitutionLabel: '气虚质',
    deltaFromPrevious: null,
  },
];

const mockAdvices: Advice[] = [
  {
    id: 'adv_1',
    category: 'diet',
    title: '少食生冷，佐以理气之品',
    content:
      '气郁体质宜疏肝理气。日常可适量食用玫瑰花茶、陈皮、佛手、白萝卜；减少生冷瓜果与冰饮，晚餐不宜过饱。',
    imageUrl: null,
  },
  {
    id: 'adv_2',
    category: 'sleep',
    title: '23 点前入睡，养肝血',
    content:
      '子时（23:00–1:00）胆经当令，此时入睡有助肝胆气机条畅。睡前一小时远离手机屏幕，可用温水泡脚 15 分钟。',
    imageUrl: null,
  },
  {
    id: 'adv_3',
    category: 'exercise',
    title: '舒缓有氧，以微汗为度',
    content:
      '推荐快走、八段锦、瑜伽等舒缓运动，每周 3–5 次、每次 30 分钟。气郁体质不宜过度剧烈运动，以微微出汗、身心舒畅为度。',
    imageUrl: null,
  },
  {
    id: 'adv_4',
    category: 'acupoint',
    title: '太冲穴',
    content:
      '位于足背，第一、二跖骨结合部之前凹陷中。太冲为肝经原穴，按揉有助疏肝解郁。每日按揉 3 分钟，以酸胀为度。',
    imageUrl: null,
  },
  {
    id: 'adv_5',
    category: 'emotion',
    title: '情志舒畅，避免久坐独处',
    content:
      '气郁体质者宜多与人交流、参与团体活动。遇情绪低落时可尝试书写记录、户外散步，避免长时间独处思虑。',
    imageUrl: null,
  },
];

export const mockReportDetail: ReportDetail = {
  ...(mockReportSummaries[0] as ReportSummary),
  pulsePatternExplanation:
    '脉来端直而细，如按琴弦。多与情志不舒、肝气郁结、气血偏弱相关，常见于长期压力较大、作息不规律的人群。',
  constitutions: [
    {
      type: 'qi-stagnation',
      label: '气郁质',
      percent: 62,
      primary: true,
      description: '肝气郁结、情志不畅所致。常见表现为情绪低落、胸胁胀满、易叹息、睡眠不实。',
    },
    {
      type: 'qi-deficiency',
      label: '气虚质',
      percent: 38,
      primary: false,
      description: '元气不足。常见表现为易疲乏、气短懒言、易出汗、抵抗力偏弱。',
    },
    {
      type: 'balanced',
      label: '平和质',
      percent: 27,
      primary: false,
      description: '阴阳气血调和的理想状态，体态适中、精力充沛、睡眠良好。',
    },
  ],
  metrics: [
    {
      key: 'rate',
      label: '脉率',
      displayValue: '72 次/分',
      normalized: 72,
      referenceRange: '60–100',
      status: 'normal',
    },
    {
      key: 'rhythm',
      label: '节律',
      displayValue: '齐',
      normalized: 88,
      referenceRange: '齐',
      status: 'normal',
    },
    {
      key: 'position',
      label: '脉位',
      displayValue: '偏沉',
      normalized: 42,
      referenceRange: '不浮不沉',
      status: 'attention',
    },
    {
      key: 'strength',
      label: '脉力',
      displayValue: '偏弱',
      normalized: 45,
      referenceRange: '有力而柔和',
      status: 'attention',
    },
    {
      key: 'fluency',
      label: '流利度',
      displayValue: '一般',
      normalized: 66,
      referenceRange: '流利从容',
      status: 'normal',
    },
    {
      key: 'tension',
      label: '紧张度',
      displayValue: '偏高（弦）',
      normalized: 38,
      referenceRange: '柔和',
      status: 'attention',
    },
  ],
  advices: mockAdvices,
  waveformPreview: Array.from({ length: 120 }, (_, index) => {
    const t = (index % 24) / 24;
    return Math.exp(-(((t - 0.18) / 0.08) ** 2)) + 0.38 * Math.exp(-(((t - 0.45) / 0.1) ** 2)) - 0.5;
  }),
};

export const mockTrend: TrendPoint[] = mockReportSummaries
  .slice()
  .reverse()
  .map((report) => ({
    date: report.measuredAt,
    label: `${new Date(report.measuredAt).getMonth() + 1}/${new Date(report.measuredAt).getDate()}`,
    score: report.score,
  }));
