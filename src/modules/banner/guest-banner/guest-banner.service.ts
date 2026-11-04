import { BannerRepository } from '@modules/banner/shared/banner.repository.js';
import { documentStorage } from '@shared/services/document-storage.service.js';
import type { GuestBannerListResponse } from '@modules/banner/guest-banner/types/guest-banner.types.js';

export type { GuestBannerListResponse };

export class GuestBannerService {
  constructor(private bannerRepository: BannerRepository = new BannerRepository()) {}

  async listActiveBanners(): Promise<GuestBannerListResponse> {
    const banners = await this.bannerRepository.findActiveBanners();
    return {
      items: await Promise.all(
        banners.map(async (b) => ({
          id: b.id,
          name: b.name,
          file: await documentStorage.resolveUrl(b.file, { folder: 'BANNER' }),
          type: b.type,
          status: b.status,
          link: b.link,
        }))
      ),
    };
  }
}
