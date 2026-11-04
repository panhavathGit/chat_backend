import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type NextFunction, type Request, type Response } from 'express';
import { CustomerBannerController } from '@modules/banner/customer-banner/customer-banner.controller.js';
import type { CustomerBannerService } from '@modules/banner/customer-banner/customer-banner.service.js';
import { AppError } from '@shared/errors/AppError.js';

// * ─── Helpers ──────────────────────────────────────────────────────────────────

function testErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }
  return res.status(500).json({ status: 'error', message: 'Internal server error' });
}

const mockService = {
  getActiveBanners: vi.fn(),
} satisfies Partial<CustomerBannerService>;

function buildApp() {
  const app = express();
  app.use(express.json());
  const controller = new CustomerBannerController(mockService as unknown as CustomerBannerService);
  app.get('/list/active', controller.getActiveBanners);
  app.use(testErrorHandler);
  return app;
}

// * ─── Tests ────────────────────────────────────────────────────────────────────

describe('CustomerBannerController', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe('GET /list/active', () => {
    it('returns 200 with active banners', async () => {
      mockService.getActiveBanners.mockResolvedValue({
        items: [
          { id: 1, file: '/promo.jpg', name: 'Promo', type: 'image', link: null, status: 'ACTIVE' },
        ],
      });

      const res = await request(app).get('/list/active');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe('Promo');
    });

    it('returns 200 with empty items when no active banners', async () => {
      mockService.getActiveBanners.mockResolvedValue({ items: [] });

      const res = await request(app).get('/list/active');

      expect(res.status).toBe(200);
      expect(res.body.data.items).toEqual([]);
    });

    it('passes errors to the error handler', async () => {
      mockService.getActiveBanners.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/list/active');

      expect(res.status).toBe(500);
    });
  });
});
