import { Request, Response } from 'express';
import { AdminBannerService } from '@modules/banner/admin-banner/admin-banner.service.js';
import { ApiResponse } from '@shared/types/response.types.js';
import {
  AdminBannerResponse,
  AdminBannerListResponse,
} from '@modules/banner/admin-banner/types/admin-banner.types.js';

export class AdminBannerController {
  constructor(private adminBannerService: AdminBannerService) {}

  /**
   * GET /admin/api/v1/banner/list
   */
  listBanners = async (
    req: Request,
    res: Response<ApiResponse<AdminBannerListResponse>>
  ): Promise<void> => {
    const result = await this.adminBannerService.listBanners();

    res.status(200).json({ status: 'success', data: result });
  };

  /**
   * POST /admin/api/v1/banner/create
   */
  createBanner = async (
    req: Request,
    res: Response<ApiResponse<AdminBannerResponse>>
  ): Promise<void> => {
    const fileUrl = req.bannerFile;
    const result = await this.adminBannerService.createBanner(req.body, fileUrl);

    res.status(201).json({ status: 'success', data: result });
  };

  /**
   * POST /admin/api/v1/banner/update
   */
  updateBanner = async (
    req: Request,
    res: Response<ApiResponse<AdminBannerResponse>>
  ): Promise<void> => {
    const fileUrl = req.bannerFile;
    const result = await this.adminBannerService.updateBanner(req.body, fileUrl);

    res.status(200).json({ status: 'success', data: result });
  };

  /**
   * POST /admin/api/v1/banner/update-status
   */
  updateBannerStatus = async (
    req: Request,
    res: Response<ApiResponse<AdminBannerResponse>>
  ): Promise<void> => {
    const result = await this.adminBannerService.updateBannerStatus(req.body);

    res.status(200).json({ status: 'success', data: result });
  };

  /**
   * POST /admin/api/v1/banner/delete/:id
   */
  deleteBanner = async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    await this.adminBannerService.deleteBanner(id);

    res.status(204).send();
  };
}
