# API Response Contracts

[← Back to project README](../README.md)

All controllers return responses that conform to two shared interfaces defined in `src/shared/types/response.types.ts`.

## `ApiResponse<T>`

Every non-paginated response uses this wrapper:

```typescript
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  code?: string; // machine-readable error code (errors only)
}
```

**Success example:**

```json
{
  "status": "success",
  "data": { "id": 42, "name": "John Doe" }
}
```

**Error example:**

```json
{
  "status": "error",
  "message": "Resource not found",
  "code": "NOT_FOUND"
}
```

## `PaginatedResponse<T>`

List endpoints nest the pagination block and results inside `data`, using the shared
`{ page, size, totalPages, totalCount }` shape (`paginationSchema` in `src/shared/schemas/response.schema.ts`,
built with `buildPagination` from `src/shared/utils/pagination.ts`):

```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    size: number;
    totalPages: number;
    totalCount: number;
  };
}
```

**Example:**

```json
{
  "status": "success",
  "data": {
    "pagination": { "page": 1, "size": 20, "totalPages": 5, "totalCount": 96 },
    "contents": [{ "id": 42, "name": "John Doe" }]
  }
}
```

## Error Classes

All thrown errors extend `AppError` from `src/shared/errors/AppError.ts`. The global error handler in `src/shared/middleware/error.middleware.ts` serialises them into `ApiResponse<never>`.

| Class                             | Status | `code`                          |
| --------------------------------- | :----: | ------------------------------- |
| `BadRequestError`                 |  400   | `BAD_REQUEST`                   |
| `UnauthorizedError`               |  401   | `UNAUTHORIZED`                  |
| `ForbiddenError`                  |  403   | `FORBIDDEN`                     |
| `NotFoundError`                   |  404   | `NOT_FOUND`                     |
| `ConflictError`                   |  409   | `CONFLICT`                      |
| `NidDuplicateReasonRequiredError` |  409   | `NID_DUPLICATE_REASON_REQUIRED` |
| `TooManyRequestsError`            |  429   | `RATE_LIMIT_EXCEEDED`           |
| `ServiceUnavailableError`         |  503   | `SERVICE_UNAVAILABLE`           |

Zod validation errors (caught by `validate()` middleware) return `400 BAD_REQUEST` with a `details` array listing each invalid field.

`code` is always present on the wire: an `AppError` constructed without one is serialised as `UNKNOWN_ERROR`.

`ForbiddenError` and `BadRequestError` take an optional `details` object, and an optional third `code` argument that overrides the default, for attaching the role/status/id context behind a 403 and for the stable codes below:

```typescript
throw new ForbiddenError(
  'Role CREDIT_ASSESSMENT cannot access application 123 at status DRAFT_NEW_S1',
  {
    applicationId: 123,
    requesterRole: 'CREDIT_ASSESSMENT',
    applicationStatus: 'DRAFT_NEW_S1',
  }
);
```

### Stable action-error codes

Staff action endpoints (draft fail / approve / amend, process recommend / decline / amend / send-back, credit approve / reject / reevaluate) publish these codes so a client can branch on `code` instead of parsing `message`. They are documented in the OpenAPI spec through `actionErrorResponses()` (`src/shared/openapi/action-error-responses.ts`).

| `code`                      | Status | Meaning                                                                                            |
| --------------------------- | :----: | -------------------------------------------------------------------------------------------------- |
| `INVALID_STATUS_TRANSITION` |  400   | Application is not in a status the action accepts; `details` has `currentStatus` and `allowedFrom` |
| `IDENTITY_NOT_VERIFIED`     |  400   | Draft approve / customer submit gate: applicant must pass user-info verification first             |
| `NO_PERMISSION`             |  403   | The role (or staff overrides) lacks the `module:action` permission (`requirePermission`)           |
| `NOT_OWNER`                 |  403   | A Credit Support officer acted on an application assigned to someone else                          |
| `UNASSIGNED`                |  403   | A Credit Support officer acted on an unassigned application — only a supervisor can                |

Bulk pick-up endpoints (`draft/review`, `review`, `request-approval/review`) do **not** use `INVALID_STATUS_TRANSITION`; they keep the `BAD_REQUEST` bulk rejection below, where `details.invalid[].status` carries each record's current status.

## Bulk assign / pick-up — wrong-status rejection

Every bulk assign and pick-up endpoint (`validateBulkIds` in `src/shared/utils/bulk-validation.util.ts`) rejects the whole request with `400 BAD_REQUEST` when any record is not in an allowed status. A record with a null status counts as invalid. The message lists up to 5 offending records by `ticketNumber` (`#<id>` when there is none); `details.invalid` always carries all of them:

```jsonc
// 400
{
  "status": "error",
  "code": "BAD_REQUEST",
  "message": "Cannot assign 2 of 3 application(s): T-2609-0012 (REQUEST_APPROVED_S2), T-2609-0031 (no status). Allowed: draft stage.",
  "details": {
    "allowedStatuses": ["DRAFT_NEW_S1", "DRAFT_REVIEWING_S1"],
    "invalid": [
      { "id": 812, "label": "T-2609-0012", "status": "REQUEST_APPROVED_S2" },
      { "id": 845, "label": "T-2609-0031", "status": null },
    ],
  },
}
```

## NID duplicate gate — admin Update Customer Info

`POST /admin/application/update/customer-info` gates changes to `nId`/`phone`: if the change
would introduce a different-phone match against another account/application sharing the same
NID, the save is refused unless the caller sends `nidOverrideReason` (10–500 chars). A
same-phone-only match, no match, or no `nId`/`phone` change all save normally with no reason
required.

Blocked (no reason sent):

```jsonc
// 409
{
  "status": "error",
  "code": "NID_DUPLICATE_REASON_REQUIRED",
  "message": "NID is shared with another account under a different phone. Provide nidOverrideReason to save.",
  "details": {
    "nId": "110223344",
    "matches": [
      { "source": "Application", "id": 4821, "phone": "098765432", "samePhone": false },
      { "source": "Account", "id": 1203, "phone": "012345678", "samePhone": true },
    ],
  },
}
```

Retry with `nidOverrideReason` set → `200` with the usual admin application detail shape. The
reason is written as an `activity_log` row (`action: NID_DUPLICATE_OVERRIDE`) in the same
transaction as the update, so it's never lost even if the save were to fail.

## Controller Response Helpers

Return plain objects from controllers; the global error handler serialises thrown `AppError` instances automatically:

```typescript
// Success
res.status(200).json({ status: 'success', data: result });

// Created
res.status(201).json({ status: 'success', data: created });

// Error (throw, don't res.json)
throw new NotFoundError('Application not found');
throw new BadRequestError('Invalid status transition', {
  expected: 'DRAFT_NEW_S1',
  actual: current,
});
```
