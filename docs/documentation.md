# Seisei — Technology & AI Models Documentation

## Overview

Seisei is a Next.js 16 (App Router) SaaS application that lets fashion brands generate AI-powered model images wearing their products, along with animated video content. The primary AI model is **Seedream 4.5**, which handles image generation, virtual try-on, and product-on-model compositing in a single call. Legacy face-swap functionality is retained in the public v1 API. All AI inference is handled through the **Segmind API** (`https://api.segmind.com/v1`).

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router), React 19, TypeScript 5 |
| Database / Auth | Supabase (PostgreSQL + Row Level Security) |
| File Storage | Supabase Storage (public buckets) |
| AI Inference | Segmind API (Seedream 4.5, Faceswap v5, Kling O1) |
| Billing | Stripe |
| Email | Resend |
| Styling | Tailwind CSS v4 |

---

## AI Provider: Segmind

All image and video generation calls are routed through a single `SegmindClient` class defined in [`src/utils/segmind.ts`](../src/utils/segmind.ts). The client exposes typed methods for each model.

**Base URL:** `https://api.segmind.com/v1`  
**Authentication:** `x-api-key` header using the `SEGMIND_API_KEY` environment variable.

The client has two internal transport methods:
- `request()` — for image endpoints; returns a base64 data URI.
- `requestBinary()` — for video endpoints; returns a raw `Buffer`.

### Helper functions

- `buildSeedreamPrompt(products, background, style, customPrompt)` — Assembles a type-aware prompt for Seedream 4.5 that correctly describes each product by its `productType` (top, bottom, dress, outerwear, shoes, accessory).
- `productTypeLabel(type)` — Returns the human-readable Japanese label for a `ProductType` value.

---

## 1. Image Generation — Seedream 4.5 *(Primary)*

**Segmind model ID:** `seedream-4.5`  
**Client method:** `segmind.seedreamGenerate(params)`  
**Used in:** [`src/app/api/generate/route.ts`](../src/app/api/generate/route.ts), [`src/app/api/v1/models/route.ts`](../src/app/api/v1/models/route.ts), [`src/app/api/v1/products/route.ts`](../src/app/api/v1/products/route.ts), [`src/app/api/v1/generate/virtual-tryon/route.ts`](../src/app/api/v1/generate/virtual-tryon/route.ts)

### Description

Seedream 4.5 is a high-quality text-to-image model with multi-image input support. It replaces the previous Z-Image Turbo + SegFit + FaceSwap pipeline for all dashboard generation. A single Seedream call can accept reference images (model face, product photos) via the `image_input` array and produce a composited fashion photograph — no separate try-on or face-swap step is needed.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `prompt` | `string` | — | Text description of the image to generate |
| `image_input` | `string[]` | `[]` | Array of public image URLs used as reference (model face, product images) |
| `size` | `string` | `"2K"` | Output resolution preset: `"1K"`, `"2K"`, or `"4K"` |
| `width` | `number` | `1024` | Output width in pixels (1024–4096) |
| `height` | `number` | `1024` | Output height in pixels (1024–4096) |
| `aspect_ratio` | `string` | `"1:1"` | Aspect ratio: `"1:1"`, `"2:3"`, `"3:4"`, `"4:3"`, `"3:2"`, `"9:16"`, `"16:9"` |
| `max_images` | `number` | `1` | Number of images to generate (1–4) |
| `sequential_image_generation` | `string` | `"disabled"` | Sequential generation control |

### Product Type System

Each product has a `product_type` field that tells the prompt builder exactly what kind of item it is:

| `product_type` | Japanese label | Description |
|---|---|---|
| `top` | トップス | Shirts, blouses, t-shirts, sweaters |
| `bottom` | ボトムス | Pants, skirts, shorts |
| `dress` | ワンピース | Dresses, jumpsuits, full-body garments |
| `outerwear` | アウター | Jackets, coats, blazers |
| `shoes` | シューズ | Footwear |
| `accessory` | アクセサリー | Bags, cups, jewellery, watches, and other non-clothing items |

The `buildSeedreamPrompt()` function uses these types to construct accurate prompts (e.g. "wearing the **top** shown in the second reference image" vs "holding the **accessory** shown in the third reference image"), preventing misclassification errors such as a dress being described as a top.

### Typical use cases

- **Dashboard generation (Seedream mode)** — model face URL + multiple product URLs passed as `image_input`. A single call produces a fashion photograph of the model wearing/holding all selected products.
- **Model portraits** — `seedreamGenerate()` with a descriptive prompt and no `image_input`.
- **Product images** — flat-lay shots via `seedreamGenerate()` with a product photography prompt.
- **Virtual try-on (v1 API)** — model + garment URLs as `image_input` with a type-aware prompt.
- **Hero & background imagery** — used by seed scripts to pre-generate UI assets.

### Response

Returns a raw binary image buffer. The server converts this to a base64 data URI or uploads directly to Supabase Storage.

---

## 2. Face Swap — Faceswap v5 *(Legacy — v1 API only)*

**Segmind model ID:** `faceswap-v5`  
**Client method:** `segmind.faceSwap(params)`  
**Used in:** [`src/app/api/v1/generate/faceswap/route.ts`](../src/app/api/v1/generate/faceswap/route.ts), [`src/app/api/generate/route.ts`](../src/app/api/generate/route.ts) (faceswap mode only)

### Description

Faceswap v5 replaces the face in a target image with the face from a source (reference) image. Both inputs must be publicly accessible URLs. **This model is no longer used in the main dashboard pipeline** — Seedream 4.5 handles face consistency natively via image reference inputs. Faceswap is retained for the standalone `POST /api/v1/generate/faceswap` endpoint and the dashboard `faceswap` mode.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `source_image` | `string` | — | Public URL of the **reference face** to apply |
| `target_image` | `string` | — | Public URL of the image to swap the face **onto** |
| `additional_prompt` | `string` | — | Optional text prompt to guide post-swap refinement |
| `seed` | `number` | — | Fixed seed for reproducibility |
| `image_format` | `string` | `"png"` | Output format: `png`, `jpeg`, or `webp` |
| `quality` | `number` | `95` | Compression quality (10–100) |

### Response

Returns a base64 data URI of the face-swapped image.

---

## 3. Video Generation — Kling O1

**Segmind model ID:** `kling-o1-image-to-video`  
**Client method:** `segmind.imageToVideo(params)`  
**Used in:** [`src/app/api/generate/video/route.ts`](../src/app/api/generate/video/route.ts)  
**Max timeout:** 300 seconds (5 minutes)

### Description

Kling O1 animates a static image into a short video clip, guided by a text prompt. The source image is typically a completed generation stored in Supabase Storage. The output is a binary MP4 buffer that is uploaded to Supabase Storage and returned as a permanent URL.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `prompt` | `string` | — | Animation prompt describing the desired motion/scene |
| `start_image_url` | `string` | — | Public URL of the source image to animate |
| `end_image_url` | `string` | — | Optional public URL for an end-frame image (interpolation) |
| `duration` | `number` | `5` | Clip length in seconds |

### Response

Returns a raw binary `Buffer` (MP4). The server uploads this directly to the `videos/` prefix in Supabase Storage via `uploadVideoToStorage()`.

### Database record

A `video_generations` row is inserted before the Kling call with `status: 'processing'` and updated to `status: 'completed'` (with `video_url`) on success, or `status: 'failed'` on error.

---

## 4. Dashboard Generation Pipeline

The `POST /api/generate` endpoint (cookie-auth, dashboard use) supports multiple modes. The primary **seedream** mode produces a complete fashion photograph in a single AI call.

```
Step 1 — Seedream 4.5      Generate a fashion photograph from model face + product images + prompt
Step 2 — Supabase Storage   Save the result and create a generations record
```

Progress is streamed to the browser via **Server-Sent Events (SSE)** so the UI can show a step-by-step progress bar in real time. The final result and a `generations` database row are sent in the `complete` event.

### Supported modes

| `mode` value | Description | Models used |
|---|---|---|
| `seedream` / `full-pipeline` | Full generation — model + products composited | Seedream 4.5 |
| `generate` | Text-to-image only | Seedream 4.5 |
| `faceswap` | Face swap only (legacy) | Faceswap v5 |

### Multi-product selection

The dashboard UI allows selecting **multiple products** simultaneously. Each product's image URL and `product_type` are sent to the API. Seedream receives all product images in a single `image_input` array (model face first, products after), and `buildSeedreamPrompt()` generates a prompt that references each product by its type and position.

### Custom prompt

Users can provide an optional **custom prompt** via a textarea in the generation UI. When provided, it is appended to the auto-generated prompt to give users fine-grained control over the output style, pose, or setting.

### Aspect ratio → dimensions mapping

| Aspect ratio | Width × Height |
|---|---|
| 1:1 | 1024 × 1024 |
| 4:5 | 896 × 1120 |
| 9:16 | 720 × 1280 |

---

## 5. Deprecated Models

The following models were previously used in the generation pipeline but have been replaced by Seedream 4.5:

| Model | Segmind ID | Replacement |
|---|---|---|
| Z-Image Turbo | `z-image-turbo` | Seedream 4.5 — higher quality, multi-image input |
| SegFit v1.3 | `segfit-v1.3` | Seedream 4.5 — handles try-on natively via image references |

The `generateImage()` method on `SegmindClient` is marked `@deprecated`. The `virtualTryOn()` method remains available but is no longer called from the dashboard pipeline.

---

## Storage Paths

Images and videos are uploaded to Supabase Storage under the following prefixes:

| Content type | Storage prefix |
|---|---|
| Outfit / garment images | `outfits/` |
| Model images (generated) | `models/` |
| Final generated images | `generated/` |
| Animated video clips | `videos/` |

---

## Environment Variables

| Variable | Description |
|---|---|
| `SEGMIND_API_KEY` | API key for all Segmind model calls |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server-only) |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (public) |
| `RESEND_API_KEY` | Resend API key for transactional email |
