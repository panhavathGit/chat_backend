import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminBannerService } from '@modules/banner/admin-banner/admin-banner.service.js';
import type { BannerRepository } from '@modules/banner/shared/banner.repository.js';

// * ─── Mock repository ──────────────────────────────────────────────────────────

const mockBannerRepo = {
  findAll: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  deleteById: vi.fn(),
} satisfies Partial<BannerRepository>;

// * ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeBanner = {
  id: 1,
  file: '/documents/BANNER/promo.jpg',
  name: 'Promo Campaign',
  type: 'image',
  link: 'https://example.com/promo',
  status: 'ACTIVE',
};

// * ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminBannerService', () => {
  let service: AdminBannerService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AdminBannerService(mockBannerRepo as unknown as BannerRepository);
  });

  // * ── listBanners ─────────────────────────────────────────────────────────────

  describe('listBanners', () => {
    it('returns all banners mapped to AdminBannerResponse', async () => {
      mockBannerRepo.findAll.mockResolvedValue([fakeBanner]);

      const result = await service.listBanners();

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual({
        id: 1,
        file: '/documents/BANNER/promo.jpg',
        name: 'Promo Campaign',
        type: 'image',
        link: 'https://example.com/promo',
        status: 'ACTIVE',
      });
    });

    it('returns empty items when no banners', async () => {
      mockBannerRepo.findAll.mockResolvedValue([]);

      const result = await service.listBanners();

      expect(result.items).toEqual([]);
    });
  });

  // * ── createBanner ─────────────────────────────────────────────────────────────

  describe('createBanner', () => {
    it('creates banner without file', async () => {
      mockBannerRepo.create.mockResolvedValue({ ...fakeBanner, file: null });

      const result = await service.createBanner({ name: 'Promo', status: 'ACTIVE' });

      expect(mockBannerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Promo', file: undefined })
      );
      expect(result.file).toBeNull();
    });

    it('creates banner with file URL', async () => {
      mockBannerRepo.create.mockResolvedValue(fakeBanner);

      await service.createBanner({ name: 'Promo' }, '/documents/BANNER/promo.jpg');

      expect(mockBannerRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ file: 'promo.jpg' })
      );
    });
  });

  // * ── updateBanner ─────────────────────────────────────────────────────────────

  describe('updateBanner', () => {
    it('throws 404 when banner not found', async () => {
      mockBannerRepo.findById.mockResolvedValue(null);

      await expect(service.updateBanner({ id: 999, name: 'X' })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Banner not found',
      });
    });

    it('updates banner fields', async () => {
      mockBannerRepo.findById.mockResolvedValue(fakeBanner);
      mockBannerRepo.update.mockResolvedValue({ ...fakeBanner, name: 'Updated' });

      const result = await service.updateBanner({ id: 1, name: 'Updated' });

      expect(mockBannerRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ name: 'Updated' })
      );
      expect(result.name).toBe('Updated');
    });

    it('includes fileUrl in update when provided', async () => {
      mockBannerRepo.findById.mockResolvedValue(fakeBanner);
      mockBannerRepo.update.mockResolvedValue({ ...fakeBanner, file: '/new.jpg' });

      await service.updateBanner({ id: 1 }, '/new.jpg');

      expect(mockBannerRepo.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ file: 'new.jpg' })
      );
    });

    it('does not overwrite file when no fileUrl provided', async () => {
      mockBannerRepo.findById.mockResolvedValue(fakeBanner);
      mockBannerRepo.update.mockResolvedValue(fakeBanner);

      await service.updateBanner({ id: 1, name: 'No File Change' });

      const callArg = mockBannerRepo.update.mock.calls[0]![1];
      expect(callArg).not.toHaveProperty('file');
    });
  });

  // * ── updateBannerStatus ───────────────────────────────────────────────────────

  describe('updateBannerStatus', () => {
    it('throws 404 when banner not found', async () => {
      mockBannerRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateBannerStatus({ id: 999, status: 'INACTIVE' })
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('updates only the status field', async () => {
      mockBannerRepo.findById.mockResolvedValue(fakeBanner);
      mockBannerRepo.updateStatus.mockResolvedValue({ ...fakeBanner, status: 'INACTIVE' });

      const result = await service.updateBannerStatus({ id: 1, status: 'INACTIVE' });

      expect(mockBannerRepo.updateStatus).toHaveBeenCalledWith(1, 'INACTIVE');
      expect(result.status).toBe('INACTIVE');
    });
  });

  // * ── deleteBanner ─────────────────────────────────────────────────────────────

  describe('deleteBanner', () => {
    it('throws 404 when banner not found', async () => {
      mockBannerRepo.findById.mockResolvedValue(null);

      await expect(service.deleteBanner(999)).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deletes the banner when it exists', async () => {
      mockBannerRepo.findById.mockResolvedValue(fakeBanner);
      mockBannerRepo.deleteById.mockResolvedValue(fakeBanner);

      await service.deleteBanner(1);

      expect(mockBannerRepo.deleteById).toHaveBeenCalledWith(1);
    });
  });
});
