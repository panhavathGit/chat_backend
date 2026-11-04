export interface BannerResponse {
  id: number;
  file: string | null;
  name: string | null;
  type: string | null;
  link: string | null;
  status: string | null;
}

export interface BannerListResponse {
  items: BannerResponse[];
}
