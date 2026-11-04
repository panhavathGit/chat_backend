import './guest-banner.openapi.js';
import { Router } from 'express';
import { GuestBannerController } from '@modules/banner/guest-banner/guest-banner.controller.js';
import { GuestBannerService } from '@modules/banner/guest-banner/guest-banner.service.js';

const guestBannerRouter = Router();

const guestBannerController = new GuestBannerController(new GuestBannerService());

// * No auth middleware — guest endpoint
guestBannerRouter.get('/list/active', guestBannerController.listActiveBanners);

export { guestBannerRouter };
