import { z } from 'zod';
import { registry } from '@config/openapi.js';
import { errorResponseSchema, successResponse } from '@shared/schemas/response.schema.js';
import { adminBannerIdParamSchema } from '@modules/banner/admin-banner/admin-banner.schema.js';
import { BANNER_TYPES, BANNER_STATUSES } from '@shared/constants/banner.constants.js';

const adminBannerResponseSchema = z.object({
  id: z.number().openapi({ description: 'Banner ID.', example: 1 }),
  file: z.string().nullable().openapi({
    description: 'Uploaded banner image URL.',
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

const adminBannerDetailResponseSchema = successResponse(adminBannerResponseSchema);

const adminBannerListResponseSchema = successResponse(
  z.object({
    items: z.array(adminBannerResponseSchema).openapi({ description: 'Banners.' }),
  })
);

const errorResponses = {
  401: {
    description: 'Unauthorized',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
  403: {
    description: 'Forbidden',
    content: { 'application/json': { schema: errorResponseSchema } },
  },
};

// * GET /admin/banner/list
registry.registerPath({
  method: 'get',
  path: '/admin/banner/list',
  tags: ['Admin Banner'],
  summary: 'List all banners',
  security: [{ BearerAuth: [] }],
  responses: {
    200: {
      description: 'List of all banners',
      content: { 'application/json': { schema: adminBannerListResponseSchema } },
    },
    ...errorResponses,
  },
});

// * POST /admin/banner/create
registry.registerPath({
  method: 'post',
  path: '/admin/banner/create',
  tags: ['Admin Banner'],
  summary: 'Create a new banner',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            name: z
              .string()
              .optional()
              .openapi({ description: 'Banner display name.', example: 'Chinese New Year Promo' }),
            type: z.enum(BANNER_TYPES).optional().openapi({
              description: 'Banner placement/category type.',
              example: BANNER_TYPES.PROMOTION,
            }),
            link: z.string().optional().openapi({
              description: 'URL the banner navigates to when tapped.',
              example: 'https://example.com/promo',
            }),
            status: z
              .enum(BANNER_STATUSES)
              .optional()
              .openapi({ description: 'Banner status.', example: BANNER_STATUSES.ACTIVE }),
            bannerFile: z.string().optional().openapi({
              description: 'Banner image file (multipart upload).',
              example: 'banner.jpg',
            }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Banner created',
      content: { 'application/json': { schema: adminBannerDetailResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    ...errorResponses,
  },
});

// * POST /admin/banner/update
registry.registerPath({
  method: 'post',
  path: '/admin/banner/update',
  tags: ['Admin Banner'],
  summary: 'Update a banner',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            id: z.number().openapi({ description: 'ID of the banner to update.', example: 1 }),
            name: z
              .string()
              .optional()
              .openapi({ description: 'Banner display name.', example: 'Chinese New Year Promo' }),
            type: z.enum(BANNER_TYPES).optional().openapi({
              description: 'Banner placement/category type.',
              example: BANNER_TYPES.PROMOTION,
            }),
            link: z.string().optional().openapi({
              description: 'URL the banner navigates to when tapped.',
              example: 'https://example.com/promo',
            }),
            status: z
              .enum(BANNER_STATUSES)
              .optional()
              .openapi({ description: 'Banner status.', example: BANNER_STATUSES.ACTIVE }),
            bannerFile: z.string().optional().openapi({
              description: 'Banner image file (multipart upload).',
              example: 'banner.jpg',
            }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Banner updated',
      content: { 'application/json': { schema: adminBannerDetailResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Banner not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    ...errorResponses,
  },
});

// * POST /admin/banner/update-status
registry.registerPath({
  method: 'post',
  path: '/admin/banner/update-status',
  tags: ['Admin Banner'],
  summary: 'Update banner status',
  security: [{ BearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            id: z.number().openapi({ description: 'ID of the banner to update.', example: 1 }),
            status: z
              .enum(BANNER_STATUSES)
              .openapi({ description: 'New banner status.', example: BANNER_STATUSES.ACTIVE }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Status updated',
      content: { 'application/json': { schema: adminBannerDetailResponseSchema } },
    },
    400: {
      description: 'Validation error',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    404: {
      description: 'Banner not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    ...errorResponses,
  },
});

// * POST /admin/banner/delete/:id
registry.registerPath({
  method: 'post',
  path: '/admin/banner/delete/{id}',
  tags: ['Admin Banner'],
  summary: 'Delete a banner',
  security: [{ BearerAuth: [] }],
  request: { params: adminBannerIdParamSchema },
  responses: {
    204: { description: 'Banner deleted' },
    404: {
      description: 'Banner not found',
      content: { 'application/json': { schema: errorResponseSchema } },
    },
    ...errorResponses,
  },
});
