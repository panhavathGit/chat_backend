import { describe, it, expect, vi, beforeEach } from 'vitest';

// * ─── Mock Prisma (hoisted so vi.mock can reference it) ─────────────────────────

const mockPrisma = vi.hoisted(() => ({
  gallery: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../../config/database.js', () => ({ prisma: mockPrisma }));

import { BannerRepository } from '@modules/banner/shared/banner.repository.js';

// * ─── Fixtures ──────────────────────────────────────────────────────────────────

const makeGallery = (
  overrides: Partial<{
    id: number;
    file: string | null;
    name: string | null;
    type: string | null;
    link: string | null;
    status: string | null;
  }> = {}
) => ({
  id: 1,
  file: '/documents/BANNER/promo.jpg',
  name: 'Promo Campaign',
  type: 'image',
  link: 'https://example.com/promo',
  status: 'ACTIVE',
  ...overrides,
});

// * ─── Tests ────────────────────────────────────────────────────────────────────

describe('BannerRepository', () => {
  let repo: BannerRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new BannerRepository();
  });

  // * ── findActiveBanners ──────────────────────────────────────────────────────

  describe('findActiveBanners', () => {
    it('calls prisma.gallery.findMany with status=active and id desc order', async () => {
      mockPrisma.gallery.findMany.mockResolvedValue([]);

      await repo.findActiveBanners();

      expect(mockPrisma.gallery.findMany).toHaveBeenCalledOnce();
      expect(mockPrisma.gallery.findMany).toHaveBeenCalledWith({
        where: { status: 'ACTIVE' },
        orderBy: [{ id: 'desc' }],
      });
    });

    it('returns the list of active banners from Prisma', async () => {
      const activeBanners = [
        makeGallery({ id: 2, status: 'ACTIVE' }),
        makeGallery({ id: 1, status: 'ACTIVE' }),
      ];
      mockPrisma.gallery.findMany.mockResolvedValue(activeBanners);

      const result = await repo.findActiveBanners();

      expect(result).toEqual(activeBanners);
      expect(result).toHaveLength(2);
    });

    it('returns an empty array when no active banners exist', async () => {
      mockPrisma.gallery.findMany.mockResolvedValue([]);

      const result = await repo.findActiveBanners();

      expect(result).toEqual([]);
    });

    it('propagates a Prisma error when the database call fails', async () => {
      mockPrisma.gallery.findMany.mockRejectedValue(new Error('DB connection lost'));

      await expect(repo.findActiveBanners()).rejects.toThrow('DB connection lost');
    });
  });

  // * ── findAll ────────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('calls prisma.gallery.findMany ordered by id desc with no where clause', async () => {
      mockPrisma.gallery.findMany.mockResolvedValue([]);

      await repo.findAll();

      expect(mockPrisma.gallery.findMany).toHaveBeenCalledOnce();
      expect(mockPrisma.gallery.findMany).toHaveBeenCalledWith({
        orderBy: [{ id: 'desc' }],
      });
    });

    it('returns all banners regardless of status', async () => {
      const allBanners = [
        makeGallery({ id: 3, status: 'INACTIVE' }),
        makeGallery({ id: 2, status: 'ACTIVE' }),
        makeGallery({ id: 1, status: 'ACTIVE' }),
      ];
      mockPrisma.gallery.findMany.mockResolvedValue(allBanners);

      const result = await repo.findAll();

      expect(result).toEqual(allBanners);
      expect(result).toHaveLength(3);
    });

    it('returns an empty array when no banners exist at all', async () => {
      mockPrisma.gallery.findMany.mockResolvedValue([]);

      const result = await repo.findAll();

      expect(result).toEqual([]);
    });

    it('propagates a Prisma error when the database call fails', async () => {
      mockPrisma.gallery.findMany.mockRejectedValue(new Error('Query timeout'));

      await expect(repo.findAll()).rejects.toThrow('Query timeout');
    });
  });

  // * ── findById ───────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('calls prisma.gallery.findUnique with the given id', async () => {
      mockPrisma.gallery.findUnique.mockResolvedValue(null);

      await repo.findById(42);

      expect(mockPrisma.gallery.findUnique).toHaveBeenCalledOnce();
      expect(mockPrisma.gallery.findUnique).toHaveBeenCalledWith({ where: { id: 42 } });
    });

    it('returns the banner when found', async () => {
      const banner = makeGallery({ id: 42 });
      mockPrisma.gallery.findUnique.mockResolvedValue(banner);

      const result = await repo.findById(42);

      expect(result).toEqual(banner);
    });

    it('returns null when no banner matches the id', async () => {
      mockPrisma.gallery.findUnique.mockResolvedValue(null);

      const result = await repo.findById(999);

      expect(result).toBeNull();
    });

    it('propagates a Prisma error when the database call fails', async () => {
      mockPrisma.gallery.findUnique.mockRejectedValue(new Error('Connection refused'));

      await expect(repo.findById(1)).rejects.toThrow('Connection refused');
    });
  });

  // * ── create ─────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('calls prisma.gallery.create with the supplied data', async () => {
      const payload = {
        file: '/documents/BANNER/new.jpg',
        name: 'New Banner',
        type: 'image',
        link: 'https://example.com',
        status: 'ACTIVE',
      };
      const created = makeGallery({ id: 10, ...payload });
      mockPrisma.gallery.create.mockResolvedValue(created);

      await repo.create(payload);

      expect(mockPrisma.gallery.create).toHaveBeenCalledOnce();
      expect(mockPrisma.gallery.create).toHaveBeenCalledWith({ data: payload });
    });

    it('returns the newly created banner record', async () => {
      const created = makeGallery({ id: 10, name: 'New Banner' });
      mockPrisma.gallery.create.mockResolvedValue(created);

      const result = await repo.create({ name: 'New Banner' });

      expect(result).toEqual(created);
      expect(result.id).toBe(10);
    });

    it('creates a banner with only partial fields supplied', async () => {
      const partial = { name: 'Minimal Banner' };
      const created = makeGallery({ id: 5, name: 'Minimal Banner', file: null, link: null });
      mockPrisma.gallery.create.mockResolvedValue(created);

      await repo.create(partial);

      expect(mockPrisma.gallery.create).toHaveBeenCalledWith({ data: partial });
    });

    it('creates a banner with no fields supplied (all optional)', async () => {
      const created = makeGallery({
        id: 6,
        file: null,
        name: null,
        type: null,
        link: null,
        status: null,
      });
      mockPrisma.gallery.create.mockResolvedValue(created);

      await repo.create({});

      expect(mockPrisma.gallery.create).toHaveBeenCalledWith({ data: {} });
    });

    it('propagates a Prisma error when the create call fails', async () => {
      mockPrisma.gallery.create.mockRejectedValue(new Error('Unique constraint failed'));

      await expect(repo.create({ name: 'Dupe' })).rejects.toThrow('Unique constraint failed');
    });
  });

  // * ── update ─────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('calls prisma.gallery.update with the correct id and data', async () => {
      const updatedBanner = makeGallery({ id: 7, name: 'Updated Name' });
      mockPrisma.gallery.update.mockResolvedValue(updatedBanner);

      await repo.update(7, { name: 'Updated Name' });

      expect(mockPrisma.gallery.update).toHaveBeenCalledOnce();
      expect(mockPrisma.gallery.update).toHaveBeenCalledWith({
        where: { id: 7 },
        data: { name: 'Updated Name' },
      });
    });

    it('returns the updated banner record', async () => {
      const updatedBanner = makeGallery({ id: 7, name: 'Updated Name', status: 'INACTIVE' });
      mockPrisma.gallery.update.mockResolvedValue(updatedBanner);

      const result = await repo.update(7, { name: 'Updated Name', status: 'INACTIVE' });

      expect(result).toEqual(updatedBanner);
      expect(result.name).toBe('Updated Name');
      expect(result.status).toBe('INACTIVE');
    });

    it('can update multiple fields in a single call', async () => {
      const payload = {
        file: '/documents/BANNER/updated.jpg',
        name: 'Updated',
        type: 'video',
        link: 'https://new-link.com',
        status: 'INACTIVE',
      };
      const updated = makeGallery({ id: 3, ...payload });
      mockPrisma.gallery.update.mockResolvedValue(updated);

      await repo.update(3, payload);

      expect(mockPrisma.gallery.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: payload,
      });
    });

    it('propagates a Prisma error when the record does not exist', async () => {
      mockPrisma.gallery.update.mockRejectedValue(new Error('Record to update not found'));

      await expect(repo.update(999, { name: 'Ghost' })).rejects.toThrow(
        'Record to update not found'
      );
    });
  });

  // * ── updateStatus ───────────────────────────────────────────────────────────

  describe('updateStatus', () => {
    it('calls prisma.gallery.update with id and only the status field', async () => {
      mockPrisma.gallery.update.mockResolvedValue(makeGallery({ id: 4, status: 'INACTIVE' }));

      await repo.updateStatus(4, 'INACTIVE');

      expect(mockPrisma.gallery.update).toHaveBeenCalledOnce();
      expect(mockPrisma.gallery.update).toHaveBeenCalledWith({
        where: { id: 4 },
        data: { status: 'INACTIVE' },
      });
    });

    it('returns the banner with the updated status', async () => {
      const updated = makeGallery({ id: 4, status: 'INACTIVE' });
      mockPrisma.gallery.update.mockResolvedValue(updated);

      const result = await repo.updateStatus(4, 'INACTIVE');

      expect(result.status).toBe('INACTIVE');
      expect(result.id).toBe(4);
    });

    it('sets status to active when activating a banner', async () => {
      const activated = makeGallery({ id: 8, status: 'ACTIVE' });
      mockPrisma.gallery.update.mockResolvedValue(activated);

      const result = await repo.updateStatus(8, 'ACTIVE');

      expect(mockPrisma.gallery.update).toHaveBeenCalledWith({
        where: { id: 8 },
        data: { status: 'ACTIVE' },
      });
      expect(result.status).toBe('ACTIVE');
    });

    it('propagates a Prisma error when the record does not exist', async () => {
      mockPrisma.gallery.update.mockRejectedValue(new Error('Record to update not found'));

      await expect(repo.updateStatus(999, 'INACTIVE')).rejects.toThrow(
        'Record to update not found'
      );
    });
  });

  // * ── deleteById ─────────────────────────────────────────────────────────────

  describe('deleteById', () => {
    it('calls prisma.gallery.delete with the given id', async () => {
      const deleted = makeGallery({ id: 5 });
      mockPrisma.gallery.delete.mockResolvedValue(deleted);

      await repo.deleteById(5);

      expect(mockPrisma.gallery.delete).toHaveBeenCalledOnce();
      expect(mockPrisma.gallery.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    it('returns the deleted banner record', async () => {
      const deleted = makeGallery({ id: 5, name: 'About to be deleted' });
      mockPrisma.gallery.delete.mockResolvedValue(deleted);

      const result = await repo.deleteById(5);

      expect(result).toEqual(deleted);
      expect(result.id).toBe(5);
      expect(result.name).toBe('About to be deleted');
    });

    it('propagates a Prisma error when the record does not exist', async () => {
      mockPrisma.gallery.delete.mockRejectedValue(new Error('Record to delete does not exist'));

      await expect(repo.deleteById(999)).rejects.toThrow('Record to delete does not exist');
    });
  });
});
