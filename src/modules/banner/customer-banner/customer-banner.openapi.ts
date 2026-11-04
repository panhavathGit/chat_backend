import { z } from 'zod';
import { registry } from '@config/openapi.js';
import { errorResponseSchema, successResponse } from '@shared/schemas/response.schema.js';
import { BANNER_STATUSES } from '@shared/constants/banner.constants.js';

// * Banner response schema
const bannerResponseSchema = z.object({
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

// * Banner list response
const bannerListResponseSchema = successResponse(
  z.object({
    items: z.array(bannerResponseSchema).openapi({ description: 'Active banners.' }),
  })
);

// * GET /customer/banner/list/active
registry.registerPath({
  method: 'get',
  path: '/customer/banner/list/active',
  tags: ['Customer Banner'],
  summary: 'List all active banners',
  description: 'Retrieve all promotional banners with active status for display in the app.',
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'List of active banners',
      content: { 'application/json': { schema: bannerListResponseSchema } },
    },
    401: {
      description: 'Unauthorized',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
  },
});
