import { BannerRepository } from '@modules/banner/shared/banner.repository.js';
import { documentStorage } from '@shared/services/document-storage.service.js';
import {
  BannerResponse,
  BannerListResponse,
} from '@modules/banner/customer-banner/types/customer-banner.types.js';

type Banner = Awaited<ReturnType<BannerRepository['findActiveBanners']>>[number];

export class CustomerBannerService {
  constructor(private bannerRepository: BannerRepository = new BannerRepository()) {}

  /**
   * Get all active banners
   */
  async getActiveBanners(): Promise<BannerListResponse> {
    const banners = await this.bannerRepository.findActiveBanners();

    return {
      items: await Promise.all(banners.map((banner) => this.mapToBannerResponse(banner))),
    };
  }

  /**
   * Map database Gallery model to BannerResponse
   */
  private async mapToBannerResponse(banner: Banner): Promise<BannerResponse> {
    return {
      id: banner.id,
      file: await documentStorage.resolveUrl(banner.file, { folder: 'BANNER' }),
      name: banner.name,
      type: banner.type,
      link: banner.link,
      status: banner.status,
    };
  }
}
