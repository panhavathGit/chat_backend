import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type NextFunction, type Request, type Response } from 'express';
import { AdminBannerController } from '@modules/banner/admin-banner/admin-banner.controller.js';
import type { AdminBannerService } from '@modules/banner/admin-banner/admin-banner.service.js';
import { AppError } from '@shared/errors/AppError.js';

// * ─── Helpers ──────────────────────────────────────────────────────────────────

function testErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ status: 'error', message: err.message, code: err.code });
  }
  return res.status(500).json({ status: 'error', message: 'Internal server error' });
}

const mockService = {
  listBanners: vi.fn(),
  createBanner: vi.fn(),
  updateBanner: vi.fn(),
  updateBannerStatus: vi.fn(),
  deleteBanner: vi.fn(),
} satisfies Partial<AdminBannerService>;

const fakeBannerResponse = {
  id: 1,
  file: '/documents/BANNER/promo.jpg',
  name: 'Promo Campaign',
  type: 'image',
  link: 'https://example.com/promo',
  status: 'ACTIVE',
};

function buildApp() {
  const app = express();
  app.use(express.json());
  const controller = new AdminBannerController(mockService as unknown as AdminBannerService);

  app.get('/list', controller.listBanners);
  app.post('/create', controller.createBanner);
  app.post('/update', controller.updateBanner);
  app.post('/update-status', controller.updateBannerStatus);
  app.post('/delete/:id', controller.deleteBanner);
  app.use(testErrorHandler);
  return app;
}

// * ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminBannerController', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  // * ── GET /list ────────────────────────────────────────────────────────────────

  describe('GET /list', () => {
    it('returns 200 with all banners', async () => {
      mockService.listBanners.mockResolvedValue({ items: [fakeBannerResponse] });

      const res = await request(app).get('/list');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe('Promo Campaign');
    });

    it('returns 200 with empty items', async () => {
      mockService.listBanners.mockResolvedValue({ items: [] });

      const res = await request(app).get('/list');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });
  });

  // * ── POST /create ─────────────────────────────────────────────────────────────

  describe('POST /create', () => {
    it('returns 201 with created banner', async () => {
      mockService.createBanner.mockResolvedValue(fakeBannerResponse);

      const res = await request(app).post('/create').send({ name: 'Promo', status: 'ACTIVE' });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(1);
      expect(mockService.createBanner).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Promo' }),
        undefined
      );
    });
  });

  // * ── POST /update ─────────────────────────────────────────────────────────────

  describe('POST /update', () => {
    it('returns 200 with updated banner', async () => {
      mockService.updateBanner.mockResolvedValue({ ...fakeBannerResponse, name: 'Updated' });

      const res = await request(app).post('/update').send({ id: 1, name: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated');
    });

    it('returns 404 when banner not found', async () => {
      mockService.updateBanner.mockRejectedValue(new AppError(404, 'Banner not found'));

      const res = await request(app).post('/update').send({ id: 999 });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Banner not found');
    });
  });

  // * ── POST /update-status ───────────────────────────────────────────────────────

  describe('POST /update-status', () => {
    it('returns 200 with updated banner', async () => {
      mockService.updateBannerStatus.mockResolvedValue({
        ...fakeBannerResponse,
        status: 'INACTIVE',
      });

      const res = await request(app).post('/update-status').send({ id: 1, status: 'INACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('INACTIVE');
    });

    it('returns 404 when banner not found', async () => {
      mockService.updateBannerStatus.mockRejectedValue(new AppError(404, 'Banner not found'));

      const res = await request(app).post('/update-status').send({ id: 999, status: 'INACTIVE' });

      expect(res.status).toBe(404);
    });
  });

  // * ── POST /delete/:id ─────────────────────────────────────────────────────────

  describe('POST /delete/:id', () => {
    it('returns 204 on success', async () => {
      mockService.deleteBanner.mockResolvedValue(undefined);

      const res = await request(app).post('/delete/1');

      expect(res.status).toBe(204);
      expect(mockService.deleteBanner).toHaveBeenCalledWith(1);
    });

    it('returns 404 when banner not found', async () => {
      mockService.deleteBanner.mockRejectedValue(new AppError(404, 'Banner not found'));

      const res = await request(app).post('/delete/999');

      expect(res.status).toBe(404);
    });
  });
});
