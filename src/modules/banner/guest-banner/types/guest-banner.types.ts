interface GuestBannerItem {
  id: number;
  name: string | null;
  file: string | null;
  type: string | null;
  status: string | null;
  link: string | null;
}

export interface GuestBannerListResponse {
  items: GuestBannerItem[];
}
