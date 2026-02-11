# Admin API

Internal API for platform administration. Requires an API key from a user with `role = 'admin'`.

## Authentication

All endpoints require a Bearer token in the `Authorization` header:

```
Authorization: Bearer sk_live_...
```

The API key must belong to a user whose profile has `role = 'admin'`. Returns `401` for invalid keys and `403` for non-admin users.

---

## Setup

### 1. Run the migration

Execute in the Supabase SQL Editor:

```sql
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT NULL;
```

### 2. Grant admin role

```bash
npx tsx scripts/set-admin.ts didier@hatoltd.com
```

### 3. Create an API key

Generate an API key for the admin account through the dashboard or via `POST /api/api-keys` while logged in.

---

## Endpoints

### GET `/api/v1/admin/stats`

Returns platform-wide statistics.

#### Request

```bash
curl -H "Authorization: Bearer sk_live_..." \
  https://yourapp.com/api/v1/admin/stats
```

#### Response

```json
{
  "generated_at": "2025-06-15T10:30:00.000Z",
  "users": {
    "total": 150,
    "new_this_month": 12,
    "premium": 25,
    "by_plan": {
      "free": 80,
      "starter": 45,
      "pro": 15,
      "business": 8,
      "enterprise": 2
    },
    "active_last_7_days": 34,
    "active_last_30_days": 78
  },
  "images": {
    "total": 12500,
    "completed": 11800,
    "failed": 200,
    "this_month": 1400
  },
  "videos": {
    "total": 3200,
    "completed": 3000,
    "failed": 50,
    "this_month": 400
  },
  "campaigns": {
    "total": 320,
    "active": 85
  },
  "products": {
    "total": 950
  },
  "ai_models": {
    "total": 210
  },
  "api_keys": {
    "total": 30,
    "active_last_30_days": 12
  }
}
```

#### Fields

| Field | Description |
|-------|-------------|
| `users.total` | Total registered users |
| `users.new_this_month` | Users created since the 1st of the current month (UTC) |
| `users.premium` | Users on pro, business, or enterprise plans |
| `users.by_plan` | User count per plan |
| `users.active_last_7_days` | Unique users who generated images in the last 7 days |
| `users.active_last_30_days` | Unique users who generated images in the last 30 days |
| `images.total` | All-time image generations |
| `images.completed` | Successfully completed image generations |
| `images.failed` | Failed image generations |
| `images.this_month` | Image generations since the 1st of the current month |
| `videos.total` | All-time video generations |
| `videos.completed` | Successfully completed video generations |
| `videos.failed` | Failed video generations |
| `videos.this_month` | Video generations since the 1st of the current month |
| `campaigns.total` | Total campaigns created |
| `campaigns.active` | Campaigns with status `active` |
| `products.total` | Total product images uploaded |
| `ai_models.total` | Total AI models created by users |
| `api_keys.total` | Total API keys issued |
| `api_keys.active_last_30_days` | API keys used in the last 30 days |

---

### GET `/api/v1/admin/users`

List users with their usage details.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `plan` | string | — | Filter by plan: `free`, `starter`, `pro`, `business`, `enterprise` |
| `search` | string | — | Search by email or brand name (case-insensitive) |
| `sort` | string | `created_at` | Sort field: `created_at`, `email`, `plan` |
| `order` | string | `desc` | Sort order: `asc`, `desc` |
| `limit` | number | `50` | Results per page (max 100) |
| `offset` | number | `0` | Pagination offset |

#### Request

```bash
# All users, newest first
curl -H "Authorization: Bearer sk_live_..." \
  "https://yourapp.com/api/v1/admin/users"

# Premium users only
curl -H "Authorization: Bearer sk_live_..." \
  "https://yourapp.com/api/v1/admin/users?plan=pro"

# Search by email
curl -H "Authorization: Bearer sk_live_..." \
  "https://yourapp.com/api/v1/admin/users?search=example.com"

# Paginated
curl -H "Authorization: Bearer sk_live_..." \
  "https://yourapp.com/api/v1/admin/users?limit=20&offset=40"
```

#### Response

```json
{
  "users": [
    {
      "id": "a1b2c3d4-...",
      "email": "user@example.com",
      "brand_name": "Acme Corp",
      "plan": "pro",
      "billing_interval": "month",
      "role": null,
      "created_at": "2025-03-10T08:00:00.000Z",
      "updated_at": "2025-06-01T12:00:00.000Z",
      "usage": {
        "images_total": 342,
        "videos_total": 28,
        "images_this_month": 45,
        "videos_this_month": 5
      }
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

#### User Fields

| Field | Description |
|-------|-------------|
| `id` | User UUID |
| `email` | User email address |
| `brand_name` | Brand name set during onboarding |
| `plan` | Current plan (`free`, `starter`, `pro`, `business`, `enterprise`) |
| `billing_interval` | `month` or `year` |
| `role` | User role (`admin` or `null`) |
| `created_at` | Account creation timestamp |
| `updated_at` | Last profile update timestamp |
| `usage.images_total` | All-time image generations by this user |
| `usage.videos_total` | All-time video generations by this user |
| `usage.images_this_month` | Image generations this billing month |
| `usage.videos_this_month` | Video generations this billing month |

---

## Error Responses

All errors follow the same format:

```json
{
  "error": "Error message here"
}
```

| Status | Meaning |
|--------|---------|
| `401` | Missing, invalid, or expired API key |
| `403` | Valid API key but user is not an admin |
| `400` | Invalid query parameters |
| `500` | Server error |
