export interface AdminBannerResponse {
  id: number;
  file: string | null;
  name: string | null;
  type: string | null;
  link: string | null;
  status: string | null;
}

import { BANNER_STATUSES } from '@shared/constants/banner.constants.js';

type BannerType = 'Promotion' | 'Feature Ads';
type BannerStatus = (typeof BANNER_STATUSES)[keyof typeof BANNER_STATUSES];

export interface AdminCreateBannerBody {
  name?: string;
  type?: BannerType;
  link?: string;
  status?: BannerStatus;
}

export interface AdminUpdateBannerBody {
  id: number;
  name?: string;
  type?: BannerType;
  link?: string;
  status?: BannerStatus;
}

export interface AdminUpdateStatusBody {
  id: number;
  status: BannerStatus;
}

export interface AdminBannerListResponse {
  items: AdminBannerResponse[];
}
