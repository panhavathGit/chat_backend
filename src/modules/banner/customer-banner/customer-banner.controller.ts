import { Request, Response } from 'express';
import { CustomerBannerService } from '@modules/banner/customer-banner/customer-banner.service.js';
import { ApiResponse } from '@shared/types/response.types.js';
import { BannerListResponse } from '@modules/banner/customer-banner/types/customer-banner.types.js';

export class CustomerBannerController {
  constructor(private customerBannerService: CustomerBannerService) {}

  /**
   * Get all active banners
   * GET /customer/api/v1/banner/list/active
   */
  getActiveBanners = async (
    req: Request,
    res: Response<ApiResponse<BannerListResponse>>
  ): Promise<void> => {
    const result = await this.customerBannerService.getActiveBanners();

    res.status(200).json({
      status: 'success',
      data: result,
    });
  };
}
