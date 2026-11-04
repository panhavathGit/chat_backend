import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type NextFunction, type Request, type Response } from 'express';
import { GuestBannerController } from '@modules/banner/guest-banner/guest-banner.controller.js';
import type { GuestBannerService } from '@modules/banner/guest-banner/guest-banner.service.js';
import { AppError } from '@shared/errors/AppError.js';

// * ─── Helpers ──────────────────────────────────────────────────────────────────

function testErrorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ status: 'error', message: err.message });
  }
  return res.status(500).json({ status: 'error', message: 'Internal server error' });
}

const mockService = {
  listActiveBanners: vi.fn(),
} satisfies Partial<GuestBannerService>;

function buildApp() {
  const app = express();
  app.use(express.json());
  const controller = new GuestBannerController(mockService as unknown as GuestBannerService);
  app.get('/list/active', controller.listActiveBanners);
  app.use(testErrorHandler);
  return app;
}

// * ─── Tests ────────────────────────────────────────────────────────────────────

describe('GuestBannerController', () => {
  let app: ReturnType<typeof buildApp>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = buildApp();
  });

  describe('GET /list/active', () => {
    it('returns 200 with status:success and data.items', async () => {
      mockService.listActiveBanners.mockResolvedValue({
        items: [
          {
            id: 1,
            name: 'High Approval Rate',
            file: '/banner1.png',
            type: 'Feature Ads',
            link: 'https://t.me/Luyleun',
            status: 'ACTIVE',
          },
        ],
      });

      const res = await request(app).get('/list/active');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe('High Approval Rate');
    });

    it('returns 200 with empty items when no active banners', async () => {
      mockService.listActiveBanners.mockResolvedValue({ items: [] });

      const res = await request(app).get('/list/active');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.items).toEqual([]);
    });

    it('passes errors to the error handler', async () => {
      mockService.listActiveBanners.mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/list/active');

      expect(res.status).toBe(500);
    });
  });
});
