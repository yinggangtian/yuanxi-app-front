import { useQuery } from '@tanstack/react-query';

import { queryKeys, staleTimes } from '../../api/queryKeys';
import type { Banner, Category, ProductDetail, ProductSummary } from '../../api/schemas/mall';
import { mockBanners, mockCategories, mockProductDetails, mockProducts } from '../../mocks';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface MallHome {
  banners: Banner[];
  categories: Category[];
  products: ProductSummary[];
}

/** 商城首页（§4.5.1）。游客可访问，不需要登录态。 */
export function useMallHome() {
  return useQuery({
    queryKey: queryKeys.mall.home(),
    queryFn: async (): Promise<MallHome> => {
      await delay(160);
      return { banners: mockBanners, categories: mockCategories, products: mockProducts };
    },
    staleTime: staleTimes.list,
  });
}

/** 商品详情（§4.5.2）。 */
export function useProductDetail(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.mall.product(id ?? ''),
    enabled: Boolean(id),
    queryFn: async (): Promise<ProductDetail | null> => {
      await delay(180);
      if (!id) return null;
      const detail = mockProductDetails[id];
      if (detail) return detail;

      // 演示数据未覆盖的商品：由摘要合成一份最小详情
      const summary = mockProducts.find((product) => product.id === id);
      if (!summary) return null;
      return {
        ...summary,
        images: [summary.imageUrl],
        description: '商品详情正在完善中。',
        certificateNumber: null,
        detailImages: [],
        skus: [
          {
            id: `${summary.id}_default`,
            name: '默认规格',
            price: summary.price,
            originalPrice: summary.originalPrice,
            stock: 50,
            purchaseLimit: null,
            imageUrl: null,
          },
        ],
        isDevice: false,
      };
    },
    staleTime: staleTimes.detail,
  });
}
