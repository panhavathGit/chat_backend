import { z } from 'zod';
import { registry } from '@config/openapi.js';
import { successResponse } from '@shared/schemas/response.schema.js';
import { BANNER_STATUSES } from '@shared/constants/banner.constants.js';

const bannerItemSchema = z.object({
  id: z.number().openapi({ description: 'Banner ID.', example: 1 }),
  file: z.string().nullable().openapi({
    description: 'Banner image URL.',
    example: 'https://storage.example.com/banners/1.jpg',
  }),
  name: z
    .string()
    .nullable()
    .openapi({ description: 'Banner display name.', example: 'Chinese New Year Promo' }),
  type: z
    .string()
    .nullable()
    .openapi({ description: 'Banner placement/category type.', example: 'HOME' }),
  link: z.string().nullable().openapi({
    description: 'URL the banner navigates to when tapped.',
    example: 'https://example.com/promo',
  }),
  status: z
    .enum(BANNER_STATUSES)
    .nullable()
    .openapi({ description: 'Banner status.', example: BANNER_STATUSES.ACTIVE }),
});

const activeBannerListResponseSchema = successResponse(
  z.object({
    items: z.array(bannerItemSchema).openapi({ description: 'Active banners.' }),
  })
);

// * GET /guest/banner/list/active
registry.registerPath({
  method: 'get',
  path: '/guest/banner/list/active',
  tags: ['Guest Banner'],
  summary: 'List all active banners (public endpoint)',
  responses: {
    200: {
      description: 'List of active banners',
      content: { 'application/json': { schema: activeBannerListResponseSchema } },
    },
  },
});
