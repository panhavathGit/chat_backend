import { z } from 'zod';
import '@config/openapi.js';
import { BANNER_TYPES, BANNER_STATUSES } from '@shared/constants/banner.constants.js';
export const adminBannerIdParamSchema = z
  .object({
    id: z.coerce
      .number()
      .int()
      .positive('Banner ID must be a positive integer')
      .openapi({ description: 'Banner ID.', example: 1 }),
  })
  .strict();

const bannerTypes = Object.values(BANNER_TYPES) as [string, ...string[]];
const bannerStatuses = Object.values(BANNER_STATUSES) as [string, ...string[]];

export const adminCreateBannerBodySchema = z
  .object({
    name: z
      .string()
      .trim()
      .max(255)
      .optional()
      .openapi({ description: 'Banner display name.', example: 'Chinese New Year Promo' }),
    type: z
      .enum(bannerTypes, {
        message: `Invalid banner type. Allowed values are: ${bannerTypes.join(', ')}`,
      })
      .optional()
      .openapi({ description: 'Banner placement/category type.', example: bannerTypes[0] }),
    link: z.string().trim().max(255).optional().openapi({
      description: 'URL the banner navigates to when tapped.',
      example: 'https://example.com/promo',
    }),
    status: z
      .enum(bannerStatuses)
      .optional()
      .openapi({ description: 'Banner status.', example: bannerStatuses[0] }),
  })
  .strict();

export const adminUpdateBannerBodySchema = z
  .object({
    id: z.coerce
      .number()
      .int()
      .positive('Banner ID must be a positive integer')
      .openapi({ description: 'ID of the banner to update.', example: 1 }),
    name: z
      .string()
      .trim()
      .max(255)
      .optional()
      .openapi({ description: 'Banner display name.', example: 'Chinese New Year Promo' }),
    type: z
      .enum(bannerTypes, {
        message: `Invalid banner type. Allowed values are: ${bannerTypes.join(', ')}`,
      })
      .optional()
      .openapi({ description: 'Banner placement/category type.', example: bannerTypes[0] }),
    link: z.string().trim().max(255).optional().openapi({
      description: 'URL the banner navigates to when tapped.',
      example: 'https://example.com/promo',
    }),
    status: z
      .enum(bannerStatuses)
      .optional()
      .openapi({ description: 'Banner status.', example: bannerStatuses[0] }),
  })
  .strict();

export const adminUpdateStatusBodySchema = z
  .object({
    id: z.coerce
      .number()
      .int()
      .positive('Banner ID must be a positive integer')
      .openapi({ description: 'ID of the banner to update.', example: 1 }),
    status: z
      .enum(bannerStatuses)
      .openapi({ description: 'New banner status.', example: bannerStatuses[0] }),
  })
  .strict();
