import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomerBannerService } from '@modules/banner/customer-banner/customer-banner.service.js';
import type { BannerRepository } from '@modules/banner/shared/banner.repository.js';

// * ─── Mock repository ──────────────────────────────────────────────────────────

const mockBannerRepo = {
  findActiveBanners: vi.fn(),
} satisfies Partial<BannerRepository>;

// * ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeBanner = {
  id: 1,
  file: '/documents/banners/promo.jpg',
  name: 'Promo Campaign',
  type: 'image',
  link: 'https://example.com/promo',
  status: 'ACTIVE',
};

// * ─── Tests ────────────────────────────────────────────────────────────────────

describe('CustomerBannerService', () => {
  let service: CustomerBannerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CustomerBannerService(mockBannerRepo as unknown as BannerRepository);
  });

  describe('getActiveBanners', () => {
    it('returns list of active banners mapped to BannerResponse', async () => {
      mockBannerRepo.findActiveBanners.mockResolvedValue([fakeBanner]);

      const result = await service.getActiveBanners();

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 1,
        file: '/documents/banners/promo.jpg',
        name: 'Promo Campaign',
        type: 'image',
        link: 'https://example.com/promo',
        status: 'ACTIVE',
      });
    });

    it('returns empty items array when no active banners', async () => {
      mockBannerRepo.findActiveBanners.mockResolvedValue([]);

      const result = await service.getActiveBanners();

      expect(result.items).toEqual([]);
    });

    it('maps multiple banners correctly', async () => {
      const banners = [
        { ...fakeBanner, id: 1 },
        { ...fakeBanner, id: 2, name: 'Second Banner' },
      ];
      mockBannerRepo.findActiveBanners.mockResolvedValue(banners);

      const result = await service.getActiveBanners();

      expect(result.items).toHaveLength(2);
      expect(result.items[1]!.name).toBe('Second Banner');
    });
  });
});
