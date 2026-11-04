import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GuestBannerService } from '@modules/banner/guest-banner/guest-banner.service.js';
import type { BannerRepository } from '@modules/banner/shared/banner.repository.js';

// * ─── Mock repository ──────────────────────────────────────────────────────────

const mockBannerRepo = {
  findActiveBanners: vi.fn(),
} satisfies Partial<BannerRepository>;

// * ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeBanner = {
  id: 1,
  name: 'High Approval Rate',
  file: 'https://storage.googleapis.com/luyleunv2-dev/GALLERY/seed-banner-1.png',
  type: 'Feature Ads',
  link: 'https://t.me/Luyleun',
  status: 'ACTIVE',
};

// * ─── Tests ────────────────────────────────────────────────────────────────────

describe('GuestBannerService', () => {
  let service: GuestBannerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GuestBannerService(mockBannerRepo as unknown as BannerRepository);
  });

  describe('listActiveBanners', () => {
    it('returns items array of active banners', async () => {
      mockBannerRepo.findActiveBanners.mockResolvedValue([fakeBanner]);

      const result = await service.listActiveBanners();

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 1,
        name: 'High Approval Rate',
        file: 'https://storage.googleapis.com/luyleunv2-dev/GALLERY/seed-banner-1.png',
        type: 'Feature Ads',
        link: 'https://t.me/Luyleun',
        status: 'ACTIVE',
      });
    });

    it('returns empty items array when no active banners', async () => {
      mockBannerRepo.findActiveBanners.mockResolvedValue([]);

      const result = await service.listActiveBanners();

      expect(result.items).toEqual([]);
    });

    it('maps multiple banners correctly', async () => {
      const banners = [
        { ...fakeBanner, id: 1 },
        { ...fakeBanner, id: 2, name: 'Khmer New Year Campaign', type: 'Promotion' },
      ];
      mockBannerRepo.findActiveBanners.mockResolvedValue(banners);

      const result = await service.listActiveBanners();

      expect(result.items).toHaveLength(2);
      expect(result.items[1]!.name).toBe('Khmer New Year Campaign');
      expect(result.items[1]!.type).toBe('Promotion');
    });

    it('maps nullable fields correctly', async () => {
      mockBannerRepo.findActiveBanners.mockResolvedValue([
        { ...fakeBanner, file: null, link: null },
      ]);

      const result = await service.listActiveBanners();

      expect(result.items[0]!.file).toBeNull();
      expect(result.items[0]!.link).toBeNull();
    });
  });
});
