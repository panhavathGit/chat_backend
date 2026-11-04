import { Router } from 'express';
import { AdminBannerController } from '@modules/banner/admin-banner/admin-banner.controller.js';
import { AdminBannerService } from '@modules/banner/admin-banner/admin-banner.service.js';
import { authenticate } from '@shared/middleware/auth.middleware.js';
import { sessionTrackingMiddleware } from '@shared/middleware/session-tracking.middleware.js';
import { setAction } from '@shared/middleware/set-action.middleware.js';
import { requireAdmin } from '@shared/middleware/rbac.middleware.js';
import { validate } from '@shared/middleware/validate.middleware.js';
import { uploadSingle } from '@shared/middleware/upload.middleware.js';
import { setFileUrl } from '@shared/middleware/set-file-url.middleware.js';
import {
  adminBannerIdParamSchema,
  adminCreateBannerBodySchema,
  adminUpdateBannerBodySchema,
  adminUpdateStatusBodySchema,
} from '@modules/banner/admin-banner/admin-banner.schema.js';
import './admin-banner.openapi.js';

const adminBannerRouter = Router();

// * Initialize dependencies
const adminBannerController = new AdminBannerController(new AdminBannerService());

// * All routes require authentication and admin role
adminBannerRouter.use(authenticate, sessionTrackingMiddleware, requireAdmin);

adminBannerRouter.get('/list', setAction('View Banner List'), adminBannerController.listBanners);

adminBannerRouter.post(
  '/create',
  setAction('Create Banner'),
  uploadSingle('bannerFile'),
  setFileUrl,
  validate({ body: adminCreateBannerBodySchema }),
  adminBannerController.createBanner
);

adminBannerRouter.post(
  '/update',
  setAction('Update Banner'),
  uploadSingle('bannerFile'),
  setFileUrl,
  validate({ body: adminUpdateBannerBodySchema }),
  adminBannerController.updateBanner
);

adminBannerRouter.post(
  '/update-status',
  setAction('Update Banner Status'),
  validate({ body: adminUpdateStatusBodySchema }),
  adminBannerController.updateBannerStatus
);

adminBannerRouter.post(
  '/delete/:id',
  setAction('Delete Banner'),
  validate({ params: adminBannerIdParamSchema }),
  adminBannerController.deleteBanner
);

export { adminBannerRouter };
