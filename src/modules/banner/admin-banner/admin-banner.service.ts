import { BannerRepository } from '@modules/banner/shared/banner.repository.js';
import {
  AdminBannerResponse,
  AdminCreateBannerBody,
  AdminUpdateBannerBody,
  AdminUpdateStatusBody,
  AdminBannerListResponse,
} from '@modules/banner/admin-banner/types/admin-banner.types.js';
import { documentStorage } from '@shared/services/document-storage.service.js';
import { NotFoundError } from '@shared/errors/AppError.js';

type Gallery = Awaited<ReturnType<BannerRepository['findAll']>>[number];

export class AdminBannerService {
  constructor(private bannerRepository: BannerRepository = new BannerRepository()) {}

  async listBanners(): Promise<AdminBannerListResponse> {
    const banners = await this.bannerRepository.findAll();

    return {
      items: await Promise.all(banners.map((b) => this.mapToResponse(b))),
    };
  }

  async createBanner(body: AdminCreateBannerBody, fileUrl?: string): Promise<AdminBannerResponse> {
    const banner = await this.bannerRepository.create({
      name: body.name,
      type: body.type,
      link: body.link,
      status: body.status,
      file: fileUrl ? documentStorage.toFilename(fileUrl) : undefined,
    });

    return this.mapToResponse(banner);
  }

  async updateBanner(body: AdminUpdateBannerBody, fileUrl?: string): Promise<AdminBannerResponse> {
    const existing = await this.bannerRepository.findById(body.id);

    if (!existing) {
      throw new NotFoundError('Banner not found');
    }

    const updateData: Parameters<BannerRepository['update']>[1] = {
      name: body.name,
      type: body.type,
      link: body.link,
      status: body.status,
    };

    if (fileUrl !== undefined) {
      updateData.file = documentStorage.toFilename(fileUrl);
    }

    const banner = await this.bannerRepository.update(body.id, updateData);

    return this.mapToResponse(banner);
  }

  async updateBannerStatus(body: AdminUpdateStatusBody): Promise<AdminBannerResponse> {
    const existing = await this.bannerRepository.findById(body.id);

    if (!existing) {
      throw new NotFoundError('Banner not found');
    }

    const banner = await this.bannerRepository.updateStatus(body.id, body.status);

    return this.mapToResponse(banner);
  }

  async deleteBanner(id: number): Promise<void> {
    const existing = await this.bannerRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Banner not found');
    }

    await this.bannerRepository.deleteById(id);
  }

  private async mapToResponse(banner: Gallery): Promise<AdminBannerResponse> {
    return {
      id: banner.id,
      file: await documentStorage.resolveUrl(banner.file, { folder: 'BANNER', namespace: 'admin' }),
      name: banner.name,
      type: banner.type,
      link: banner.link,
      status: banner.status,
    };
  }
}
