import { Request, Response } from 'express';
import {
  GuestBannerService,
  GuestBannerListResponse,
} from '@modules/banner/guest-banner/guest-banner.service.js';
import { ApiResponse } from '@shared/types/response.types.js';

export class GuestBannerController {
  constructor(private guestBannerService: GuestBannerService) {}

  /**
   * GET /guest/api/v1/banner/list/active
   * No auth required
   */
  listActiveBanners = async (
    _req: Request,
    res: Response<ApiResponse<GuestBannerListResponse>>
  ): Promise<void> => {
    const result = await this.guestBannerService.listActiveBanners();
    res.status(200).json({ status: 'success', data: result });
  };
}
