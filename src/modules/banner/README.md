# Banner Module

[← Back to project README](../../README.md)

Manages promotional banners. Admin has full CRUD access; customers see only active banners.

## Module Structure

```
src/modules/banner/
├── index.ts                            # Exports routers and repository
├── shared/
│   └── banner.repository.ts            # Shared DB queries (Gallery model)
├── admin-banner/
│   ├── admin-banner.controller.ts
│   ├── admin-banner.service.ts
│   ├── admin-banner.routes.ts          # Requires ADMIN role
│   ├── admin-banner.schema.ts
│   ├── admin-banner.openapi.ts
│   └── types/admin-banner.types.ts
└── customer-banner/
    ├── customer-banner.controller.ts
    ├── customer-banner.service.ts
    ├── customer-banner.routes.ts        # Requires auth
    ├── customer-banner.openapi.ts
    └── types/customer-banner.types.ts
```

## Admin Endpoints (require `ADMIN` role)

| Method | Path                                 | Description                             |
| ------ | ------------------------------------ | --------------------------------------- |
| `GET`  | `/admin/api/v1/banner/list`          | List all banners                        |
| `POST` | `/admin/api/v1/banner/create`        | Create banner (multipart: `bannerFile`) |
| `POST` | `/admin/api/v1/banner/update`        | Update banner (multipart: `bannerFile`) |
| `POST` | `/admin/api/v1/banner/update-status` | Update banner status only               |
| `POST` | `/admin/api/v1/banner/delete/:id`    | Delete a banner                         |

## Guest Endpoints (no auth)

| Method | Path                               | Description         |
| ------ | ---------------------------------- | ------------------- |
| `GET`  | `/guest/api/v1/banner/list/active` | List active banners |

## Customer Endpoints (require auth)

| Method | Path                                  | Description         |
| ------ | ------------------------------------- | ------------------- |
| `GET`  | `/customer/api/v1/banner/list/active` | List active banners |

## Type Definitions

```typescript
type BannerType = 'Promotion' | 'Feature Ads';
type BannerStatus = 'ACTIVE' | 'INACTIVE';

interface AdminCreateBannerBody {
  name?: string;
  type?: BannerType;
  link?: string;
  status?: BannerStatus;
}

interface AdminUpdateBannerBody {
  id: number;
  name?: string;
  type?: BannerType;
  link?: string;
  status?: BannerStatus;
}

interface AdminUpdateStatusBody {
  id: number;
  status: BannerStatus;
}

interface AdminBannerResponse {
  id: number;
  file: string | null;
  name: string | null;
  type: string | null;
  link: string | null;
  status: string | null;
}

interface BannerListResponse {
  banners: Banner[];
}

interface Banner {
  id: number;
  file: string;
  name: string;
  type: string | null;
  link: string | null;
  status: string;
  createdAt: Date;
}
```

## Business Rules

- Customer endpoint returns only `status = 'ACTIVE'` banners, ordered newest first.
- Admin: `404 Not Found` on update, status change, or delete if banner does not exist.
- File upload is optional on admin update — existing file is kept if none is provided.

## Integration Points

- **Database:** Prisma ORM for `Gallery` model
- **Auth:** `authenticate` + `requireAdmin` (admin) / `authenticate` (customer)
- **File Storage:** Multer + `setFileUrl` middleware (admin only)
- **Validation:** Zod schemas with `validate()` middleware
