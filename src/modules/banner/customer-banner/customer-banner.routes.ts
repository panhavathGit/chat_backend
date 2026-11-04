import { Router } from 'express';
import { CustomerBannerController } from '@modules/banner/customer-banner/customer-banner.controller.js';
import { CustomerBannerService } from '@modules/banner/customer-banner/customer-banner.service.js';
import { authenticate } from '@shared/middleware/auth.middleware.js';
import { sessionTrackingMiddleware } from '@shared/middleware/session-tracking.middleware.js';
import { setAction } from '@shared/middleware/set-action.middleware.js';
import { requireCustomer } from '@shared/middleware/rbac.middleware.js';
import './customer-banner.openapi.js';

const customerBannerRouter = Router();

// * Initialize dependencies
const customerBannerController = new CustomerBannerController(new CustomerBannerService());

// * All routes require authentication
customerBannerRouter.use(authenticate, sessionTrackingMiddleware, requireCustomer);

// * Routes
customerBannerRouter.get(
  '/list/active',
  setAction('View Active Banners'),
  customerBannerController.getActiveBanners
);

export { customerBannerRouter };
