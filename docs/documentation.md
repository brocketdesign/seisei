# Seisei — Technology & AI Models Documentation

## Overview

Seisei is a Next.js 16 (App Router) SaaS application that lets fashion brands generate AI-powered model images, virtual try-ons, face swaps, and animated videos. All AI inference is handled through the **Segmind API** (`https://api.segmind.com/v1`). The platform is built on the following core stack:

| Layer | Technology |
|---|---|
| Framework | Next.js 16.1.6 (App Router), React 19, TypeScript 5 |
| Database / Auth | Supabase (PostgreSQL + Row Level Security) |
| File Storage | Supabase Storage (public buckets) |
| AI Inference | Segmind API |
| Billing | Stripe |
| Email | Resend |
| Styling | Tailwind CSS v4 |

---

## AI Provider: Segmind

All image and video generation calls are routed through a single `SegmindClient` class defined in [`src/utils/segmind.ts`](../src/utils/segmind.ts). The client abstracts four Segmind models and exposes typed methods for each.

**Base URL:** `https://api.segmind.com/v1`  
**Authentication:** `x-api-key` header using the `SEGMIND_API_KEY` environment variable.

The client has two internal transport methods:
- `request()` — for image endpoints; returns a base64 data URI.
- `requestBinary()` — for video endpoints; returns a raw `Buffer`.

---

## 1. Image Generation — Z-Image Turbo

**Segmind model ID:** `z-image-turbo`  
**Client method:** `segmind.generateImage(params)`  
**Used in:** [`src/app/api/generate/route.ts`](../src/app/api/generate/route.ts), [`src/app/api/v1/models/route.ts`](../src/app/api/v1/models/route.ts), [`src/app/api/v1/products/route.ts`](../src/app/api/v1/products/route.ts)

### Description

Z-Image Turbo is a fast, photorealistic text-to-image model optimised for fashion and product photography. It is used to generate model portraits and flat-lay product images from a text prompt.

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `prompt` | `string` | — | Text description of the image to generate |
| `negative_prompt` | `string` | — | Elements to exclude (e.g. `"person, mannequin, blurry"`) |
| `steps` | `number` | `8` | Diffusion steps (range 1–8) |
| `guidance_scale` | `number` | `1` | Classifier-free guidance scale — keep low for this model |
| `seed` | `number` | `-1` | `-1` for random; fixed value for reproducible results |
| `width` | `number` | `1024` | Output width in pixels |
| `height` | `number` | `1024` | Output height in pixels |
| `image_format` | `string` | `"webp"` | Output format: `webp`, `png`, or `jpeg` |
| `quality` | `number` | `90` | Compression quality (1–100) |
| `base_64` | `boolean` | `false` | If `false`, the API returns a raw binary response |

### Typical use cases

- **Model portraits** — full-body fashion photograph from a descriptive prompt built via `buildModelPrompt()`. Rendered at `1024×1024` (1:1), `896×1120` (4:5), or `720×1280` (9:16) depending on the chosen aspect ratio.
- **Product / garment images** — flat-lay shots rendered at `768×768` with a `negative_prompt` that excludes any human subjects.
- **Hero & background imagery** — used by seed scripts to pre-generate UI assets (`scripts/generate-hero-images.ts`, `scripts/generate-background-images.ts`, etc.).

### Response

Returns a base64 data URI (e.g. `data:image/png;base64,...`) which is then uploaded to Supabase Storage to obtain a permanent public URL.

---

## 2. Virtual Try-On — Flux-2 Klein-9b

**Segmind model ID:** `flux-2-klein-9b`  
**Client method:** `segmind.virtualTryOn(params)`  
**Used in:** [`src/app/api/generate/route.ts`](../src/app/api/generate/route.ts), [`src/app/api/v1/generate/virtual-tryon/route.ts`](../src/app/api/v1/generate/virtual-tryon/route.ts)

### Description

FLUX.2 [klein] is an ultra-fast, photorealistic image-to-image transformation model optimised for consumer GPUs. Given a text prompt and an array of input image URLs (e.g. a model photo and a garment photo), it composites the outfit onto the model with realistic draping and lighting. Input images **must be publicly accessible URLs**, so images are uploaded to Supabase Storage before the call is made.

**Average cost per call:** ~$0.038

### Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `prompt` | `string` | — | Text description of the transformation (e.g. `"make the woman in image 1 wear the open cardigan from image 2"`) |
| `image_urls` | `string[]` | — | Array of public URLs for input images (model image first, outfit image second) |
| `negative_prompt` | `string` | `"low quality, blurry, less details"` | Elements to exclude from the output |
| `seed` | `number` | `3425234` | Fixed seed for reproducibility |
| `cfg` | `number` | `5` | CFG scale (1–20) |
| `sampler` | `string` | `"euler"` | Sampler algorithm |
| `steps` | `number` | `20` | Diffusion steps (1–100) |
| `aspect_ratio` | `string` | `"1:1"` | Output aspect ratio |
| `go_fast` | `boolean` | `true` | Enable fast inference mode |
| `image_format` | `string` | `"png"` | Output format: `png`, `jpeg`, or `webp` |
| `quality` | `number` | `90` | Compression quality (10–100) |

### Response

Returns a binary image response. The client converts this to a base64 data URI for downstream use.

### Standalone API endpoint

The public REST API also exposes try-on directly at `POST /api/v1/generate/virtual-tryon`. See [`docs/admin-api.md`](admin-api.md) for the full request/response schema.

---

## 3. Face Swap — Faceswap v5

**Segmind model ID:** `faceswap-v5`  
**Client method:** `segmind.faceSwap(params)`  
**Used in:** [`src/app/api/generate/route.ts`](../src/app/api/generate/route.ts)

### Description

Faceswap v5 replaces the face in a target image with the face from a source (reference) image. Both inputs must be publicly accessible URLs. In the generation pipeline, the source face is taken from the model's uploaded avatar, and the target is the AI-generated full-body image produced in Step 1.

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

### Failure handling

Face swap is treated as a best-effort step. If the Segmind call fails (e.g. no face detected), the pipeline logs the error and continues with the original generated model image, so the user always receives a result.

---

## 4. Video Generation — Kling O1

**Segmind model ID:** `kling-o1-image-to-video`  
**Client method:** `segmind.imageToVideo(params)`  
**Used in:** [`src/app/api/generate/video/route.ts`](../src/app/api/generate/video/route.ts)  
**Max timeout:** 300 seconds (5 minutes)

### Description

Kling O1 animates a static image into a short video clip, guided by a text prompt. The source image is typically a completed generation (try-on result) stored in Supabase Storage. The output is a binary MP4 buffer that is uploaded to Supabase Storage and returned as a permanent URL.

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

## 5. Full Generation Pipeline

The `POST /api/generate` endpoint (cookie-auth, dashboard use) supports a `full-pipeline` mode that chains all four models into a single streamed operation.

```
Step 1 — Z-Image Turbo     Generate a full-body model image from a prompt
Step 2 — Supabase Storage  Upload outfit + generated model to obtain public URLs
Step 3 — Faceswap v5       Swap the model's reference avatar onto the generated body
Step 4 — Flux-2 Klein-9b   Dress the face-swapped model in the target outfit
```

Progress is streamed to the browser via **Server-Sent Events (SSE)** so the UI can show a step-by-step progress bar in real time. The final result and a `generations` database row are sent in the `complete` event.

### Supported modes

| `mode` value | Description | Models used |
|---|---|---|
| `full-pipeline` | Full 4-step pipeline | Z-Image Turbo → Faceswap v5 → Flux-2 Klein-9b |
| `tryon` | Try-on only (existing model + outfit) | Flux-2 Klein-9b |
| `generate` | Text-to-image only | Z-Image Turbo |
| `faceswap` | Face swap only | Faceswap v5 |

### Aspect ratio → dimensions mapping

| Aspect ratio | Width × Height |
|---|---|
| 1:1 | 1024 × 1024 |
| 4:5 | 896 × 1120 |
| 9:16 | 720 × 1280 |

---

## Storage Paths

Images and videos are uploaded to Supabase Storage under the following prefixes:

| Content type | Storage prefix |
|---|---|
| Outfit / garment images | `outfits/` |
| Model images (generated) | `models/` |
| Face-swapped model images | `faceswapped/` |
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
