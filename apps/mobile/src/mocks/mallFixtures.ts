/** 商城 / 交易演示数据。全部为虚构商品，不对应真实在售品。 */
import type {
  Address,
  Banner,
  CartItem,
  Category,
  CheckoutPreview,
  OrderDetail,
  OrderSummary,
  ProductDetail,
  ProductSummary,
} from '../api/schemas';

const minutesFromNow = (minutes: number): string =>
  new Date(Date.now() + minutes * 60_000).toISOString();

const daysAgo = (days: number, hour = 10, minute = 21): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

/** 金刚区品类（§4.5.1）。icon 为 Lucide 图标名。 */
export const mockCategories: Category[] = [
  { id: 'cat_device', name: '智能设备', icon: 'watch' },
  { id: 'cat_accessory', name: '配件', icon: 'cable' },
  { id: 'cat_tea', name: '养生茶饮', icon: 'cup-soda' },
  { id: 'cat_supplement', name: '营养补剂', icon: 'pill' },
  { id: 'cat_moxa', name: '艾灸理疗', icon: 'flame' },
  { id: 'cat_member', name: '会员服务', icon: 'badge-check' },
];

export const mockBanners: Banner[] = [
  {
    id: 'bn_1',
    title: '脉搏环 Pro',
    subtitle: '更精准的每一次脉诊',
    badge: 'NEW',
    imageUrl: null,
    productId: 'p_ring_pro',
  },
  {
    id: 'bn_2',
    title: '秋日理气茶饮',
    subtitle: '白露时节，疏肝解郁',
    badge: null,
    imageUrl: null,
    productId: 'p_rose_tea',
  },
];

export const mockProducts: ProductSummary[] = [
  {
    id: 'p_ring_pro',
    title: '元息脉搏环 Pro 智能健康监测设备',
    imageUrl: 'https://placehold.co/600x600/EEF9F8/12998E?text=Ring+Pro',
    price: 129900,
    originalPrice: 149900,
    tags: [{ label: '健康监测', requiresCertificate: false }],
    recommendedReason: null,
  },
  {
    id: 'p_rose_tea',
    title: '玫瑰花茶 疏肝理气 100g',
    imageUrl: 'https://placehold.co/600x600/FDF2F4/D0677A?text=Tea',
    price: 6800,
    originalPrice: null,
    tags: [{ label: '疏肝理气', requiresCertificate: false }],
    recommendedReason: '基于你的气郁体质',
  },
  {
    id: 'p_moxa',
    title: '艾草足浴包 温经散寒 30 袋',
    imageUrl: 'https://placehold.co/600x600/F5F7F9/6F9E4F?text=Moxa',
    price: 12800,
    originalPrice: 15800,
    tags: [{ label: '温经散寒', requiresCertificate: false }],
    recommendedReason: null,
  },
  {
    id: 'p_strap',
    title: '脉搏环专用表带 亲肤硅胶',
    imageUrl: 'https://placehold.co/600x600/F5F7F9/6B7985?text=Strap',
    price: 4900,
    originalPrice: null,
    tags: [],
    recommendedReason: null,
  },
  {
    id: 'p_ginseng',
    title: '西洋参含片 益气养阴 60 片',
    imageUrl: 'https://placehold.co/600x600/FBF6EE/C7894B?text=Ginseng',
    price: 18800,
    originalPrice: null,
    tags: [{ label: '益气养阴', requiresCertificate: false }],
    recommendedReason: '基于你的气虚倾向',
  },
  {
    id: 'p_pillow',
    title: '决明子助眠枕 安神助眠',
    imageUrl: 'https://placehold.co/600x600/F0F4FA/5B7FD6?text=Pillow',
    price: 15900,
    originalPrice: null,
    tags: [],
    recommendedReason: null,
  },
];

export const mockProductDetails: Record<string, ProductDetail> = {
  p_ring_pro: {
    ...(mockProducts[0] as ProductSummary),
    images: [
      'https://placehold.co/900x900/EEF9F8/12998E?text=Ring+Pro+1',
      'https://placehold.co/900x900/D3F0ED/0B7F76?text=Ring+Pro+2',
    ],
    description:
      '元息脉搏环 Pro 采用多通道光电传感与压力感应，配合元息 App 完成脉象采集与健康趋势记录。单次充电续航约 7 天，支持 IPX7 防水。',
    // 未取得医疗器械注册证前不展示证号，文案统一用「健康监测」（§8）
    certificateNumber: null,
    detailImages: [],
    skus: [
      {
        id: 'sku_ring_gray',
        name: '星空灰 · 标准版',
        price: 129900,
        originalPrice: 149900,
        stock: 42,
        purchaseLimit: 2,
        imageUrl: null,
      },
      {
        id: 'sku_ring_silver',
        name: '月白银 · 标准版',
        price: 129900,
        originalPrice: 149900,
        stock: 8,
        purchaseLimit: 2,
        imageUrl: null,
      },
    ],
    isDevice: true,
  },
  p_rose_tea: {
    ...(mockProducts[1] as ProductSummary),
    images: ['https://placehold.co/900x900/FDF2F4/D0677A?text=Rose+Tea'],
    description:
      '精选平阴重瓣玫瑰，低温烘焙锁香。气郁体质日常代茶饮，每次 3–5 朵，沸水冲泡 5 分钟。孕期及经期量多者不宜。',
    certificateNumber: null,
    detailImages: [],
    skus: [
      { id: 'sku_tea_100', name: '100g 罐装', price: 6800, originalPrice: null, stock: 120, purchaseLimit: null, imageUrl: null },
      { id: 'sku_tea_200', name: '200g 罐装', price: 12800, originalPrice: null, stock: 60, purchaseLimit: null, imageUrl: null },
    ],
    isDevice: false,
  },
};

export const mockCartItems: CartItem[] = [
  {
    id: 'ci_1',
    productId: 'p_ring_pro',
    skuId: 'sku_ring_gray',
    title: '元息脉搏环 Pro 智能健康监测设备',
    skuName: '星空灰 · 标准版',
    imageUrl: 'https://placehold.co/200x200/EEF9F8/12998E?text=Ring',
    price: 129900,
    quantity: 1,
    stock: 42,
    purchaseLimit: 2,
    selected: true,
    invalid: false,
    invalidReason: null,
  },
  {
    id: 'ci_2',
    productId: 'p_rose_tea',
    skuId: 'sku_tea_100',
    title: '玫瑰花茶 疏肝理气 100g',
    skuName: '100g 罐装',
    imageUrl: 'https://placehold.co/200x200/FDF2F4/D0677A?text=Tea',
    price: 6800,
    quantity: 2,
    stock: 120,
    purchaseLimit: null,
    selected: true,
    invalid: false,
    invalidReason: null,
  },
  {
    id: 'ci_3',
    productId: 'p_moxa',
    skuId: 'sku_moxa',
    title: '艾草足浴包 温经散寒 30 袋',
    skuName: '30 袋装',
    imageUrl: 'https://placehold.co/200x200/F5F7F9/6F9E4F?text=Moxa',
    price: 12800,
    quantity: 1,
    stock: 0,
    purchaseLimit: null,
    selected: false,
    invalid: true,
    invalidReason: '该商品已售罄',
  },
];

export const mockAddresses: Address[] = [
  {
    id: 'addr_1',
    receiver: '林一',
    phone: '13800138000',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    detail: '文三路 100 号元息大厦 12 层',
    isDefault: true,
  },
  {
    id: 'addr_2',
    receiver: '林一',
    phone: '13800138000',
    province: '上海市',
    city: '上海市',
    district: '徐汇区',
    detail: '漕溪北路 88 号 A 座 2201',
    isDefault: false,
  },
];

export const mockCheckoutPreview: CheckoutPreview = {
  items: [
    {
      id: 'oi_1',
      productId: 'p_ring_pro',
      title: '元息脉搏环 Pro 智能健康监测设备',
      skuName: '星空灰 · 标准版',
      imageUrl: 'https://placehold.co/200x200/EEF9F8/12998E?text=Ring',
      price: 129900,
      quantity: 1,
    },
    {
      id: 'oi_2',
      productId: 'p_rose_tea',
      title: '玫瑰花茶 疏肝理气 100g',
      skuName: '100g 罐装',
      imageUrl: 'https://placehold.co/200x200/FDF2F4/D0677A?text=Tea',
      price: 6800,
      quantity: 2,
    },
  ],
  goodsAmount: 143500,
  freightAmount: 0,
  discountAmount: 0,
  maxPointsDeduction: 5000,
  payAmount: 143500,
  address: mockAddresses[0] as Address,
  containsDevice: true,
};

export const mockOrders: OrderSummary[] = [
  {
    id: 'o_1001',
    orderNo: '20260919102100001',
    status: 'pending-payment',
    createdAt: daysAgo(0),
    items: mockCheckoutPreview.items,
    totalQuantity: 3,
    payAmount: 143500,
    payExpireAt: minutesFromNow(14),
    containsDevice: true,
  },
  {
    id: 'o_1000',
    orderNo: '20260910180300002',
    status: 'pending-receipt',
    createdAt: daysAgo(9, 18, 3),
    items: [
      {
        id: 'oi_3',
        productId: 'p_rose_tea',
        title: '玫瑰花茶 疏肝理气 100g',
        skuName: '100g 罐装',
        imageUrl: 'https://placehold.co/200x200/FDF2F4/D0677A?text=Tea',
        price: 6800,
        quantity: 2,
      },
    ],
    totalQuantity: 2,
    payAmount: 13600,
    payExpireAt: null,
    containsDevice: false,
  },
  {
    id: 'o_0999',
    orderNo: '20260820091200003',
    status: 'completed',
    createdAt: daysAgo(30, 9, 12),
    items: [
      {
        id: 'oi_4',
        productId: 'p_strap',
        title: '脉搏环专用表带 亲肤硅胶',
        skuName: '均码 · 雾灰',
        imageUrl: 'https://placehold.co/200x200/F5F7F9/6B7985?text=Strap',
        price: 4900,
        quantity: 1,
      },
    ],
    totalQuantity: 1,
    payAmount: 4900,
    payExpireAt: null,
    containsDevice: false,
  },
];

export const mockOrderDetails: Record<string, OrderDetail> = {
  o_1000: {
    ...(mockOrders[1] as OrderSummary),
    address: mockAddresses[0] as Address,
    goodsAmount: 13600,
    freightAmount: 0,
    discountAmount: 0,
    pointsDeduction: 0,
    remark: '',
    paidAt: daysAgo(9, 18, 5),
    logisticsCompany: '顺丰速运',
    logisticsNo: 'SF1234567890',
    logistics: [
      { time: daysAgo(1, 9, 30), description: '快件已到达【杭州西湖区文三路营业点】，正在派送' },
      { time: daysAgo(2, 20, 12), description: '快件已从【上海转运中心】发出' },
      { time: daysAgo(3, 14, 2), description: '【上海仓】已揽收' },
    ],
  },
};
