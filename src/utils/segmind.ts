/**
 * Segmind API Client
 * 
 * Models:
 * - segfit-v1.3: Virtual try-on for clothes
 * - z-image-turbo: Fast photorealistic image generation
 * - faceswap-v5: Face/head swapping
 */

const SEGMIND_API_URL = 'https://api.segmind.com/v1';

interface SegfitRequest {
    outfit_image: string; // URL of clothing/outfit image
    model_image: string;  // URL of model/person image
    mask_image?: string;
    model_type?: 'Quality' | 'Speed';
    cn_strength?: number; // 0-1, default 0.8
    cn_end?: number;      // 0-1, default 0.5
    image_format?: 'png' | 'jpeg' | 'webp';
    image_quality?: number; // 1-100, default 90
    seed?: number;
    base64?: boolean;
}

interface ZImageTurboRequest {
    prompt: string;
    negative_prompt?: string;
    steps?: number;          // default 8, range 1-8
    guidance_scale?: number;  // default 1, keep low for this model
    seed?: number;
    width?: number;           // default 1024
    height?: number;          // default 1024
    image_format?: 'webp' | 'png' | 'jpeg';
    quality?: number;         // 1-100, default 90
    base_64?: boolean;        // false = raw binary (default)
}

interface FaceswapRequest {
    source_image: string; // URL of the face to put (reference face)
    target_image: string; // URL of the image to swap face onto
    additional_prompt?: string;
    seed?: number;
    image_format?: 'png' | 'jpeg' | 'webp';
    quality?: number; // 10-100, default 95
}

interface KlingImageToVideoRequest {
    prompt: string;
    start_image_url: string; // URL of the source image
    end_image_url?: string;  // Optional end image URL
    duration?: number;       // Duration in seconds, default 5
}

interface SegmindResponse {
    image?: string; // base64 encoded image
    video?: Buffer; // raw video binary
    status?: string;
    error?: string;
}

/**
 * Strip data URI prefix and fix base64 padding.
 * Accepts both raw base64 and data URIs like "data:image/png;base64,ABC..."
 */
function sanitizeBase64(input: string): string {
    // Strip data URI prefix if present
    let raw = input;
    const match = raw.match(/^data:[^;]+;base64,(.*)$/);
    if (match) {
        raw = match[1];
    }
    // Fix padding: base64 length must be a multiple of 4
    const remainder = raw.length % 4;
    if (remainder === 2) raw += '==';
    else if (remainder === 3) raw += '=';
    else if (remainder === 1) raw = raw.slice(0, -1); // invalid char, trim
    return raw;
}

class SegmindClient {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async request(model: string, data: Record<string, unknown>): Promise<SegmindResponse> {
        const response = await fetch(`${SEGMIND_API_URL}/${model}`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Segmind API error: ${response.status} - ${error}`);
        }

        const contentType = response.headers.get('content-type') || '';

        // Handle JSON responses (API may return base64 or URL in JSON)
        if (contentType.includes('application/json')) {
            const json = await response.json();

            // Extract image from common JSON field names
            const rawImage = json.image ?? json.data ?? json.output ?? null;
            const imageUrl = json.image_url ?? json.url ?? json.output_url ?? null;

            if (typeof rawImage === 'string' && rawImage.length > 0) {
                // Already a full data URI
                if (rawImage.startsWith('data:')) {
                    return { image: rawImage };
                }
                // Raw base64 string — wrap in a data URI
                return { image: `data:image/png;base64,${sanitizeBase64(rawImage)}` };
            }

            if (typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
                // API returned a URL — fetch the actual image
                const imgResponse = await fetch(imageUrl);
                const imgBuffer = await imgResponse.arrayBuffer();
                const imgMime = imgResponse.headers.get('content-type')?.split(';')[0].trim() || 'image/png';
                const imgBase64 = Buffer.from(imgBuffer).toString('base64');
                return { image: `data:${imgMime};base64,${imgBase64}` };
            }

            throw new Error(
                `Segmind API returned unexpected JSON response for ${model}: ${JSON.stringify(json).slice(0, 300)}`
            );
        }

        // Binary response — detect MIME type from Content-Type header
        const mimeType = contentType.startsWith('image/') ? contentType.split(';')[0].trim() : 'image/png';
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return { image: `data:${mimeType};base64,${base64}` };
    }

    /**
     * Raw request that returns binary buffer (for video endpoints)
     */
    private async requestBinary(model: string, data: Record<string, unknown>): Promise<Buffer> {
        const response = await fetch(`${SEGMIND_API_URL}/${model}`, {
            method: 'POST',
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Segmind API error: ${response.status} - ${error}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }

    /**
     * Virtual try-on using SegFit v1.3
     * Put clothing on a model/person image
     */
    async virtualTryOn(params: SegfitRequest): Promise<SegmindResponse> {
        return this.request('segfit-v1.3', {
            outfit_image: params.outfit_image,
            model_image: params.model_image,
            ...(params.mask_image && { mask_image: params.mask_image }),
            model_type: params.model_type || 'Quality',
            cn_strength: params.cn_strength ?? 0.8,
            cn_end: params.cn_end ?? 0.5,
            image_format: params.image_format ?? 'png',
            image_quality: params.image_quality ?? 90,
            seed: params.seed ?? 42,
            base64: params.base64 ?? false,
        });
    }

    /**
     * Generate photorealistic images using Z-Image Turbo
     */
    async generateImage(params: ZImageTurboRequest): Promise<SegmindResponse> {
        return this.request('z-image-turbo', {
            prompt: params.prompt,
            steps: params.steps ?? 8,
            guidance_scale: params.guidance_scale ?? 1,
            seed: params.seed ?? -1,
            width: params.width ?? 1024,
            height: params.height ?? 1024,
            image_format: params.image_format ?? 'webp',
            quality: params.quality ?? 95,
            base_64: params.base_64 ?? false,
        });
    }

    /**
     * Face swap using Faceswap v5
     * Both source_image and target_image must be URLs (not base64)
     */
    async faceSwap(params: FaceswapRequest): Promise<SegmindResponse> {
        return this.request('faceswap-v5', {
            source_image: params.source_image,
            target_image: params.target_image,
            additional_prompt: params.additional_prompt ?? '',
            seed: params.seed ?? 8005332,
            image_format: params.image_format ?? 'png',
            quality: params.quality ?? 95,
        });
    }

    /**
     * Image-to-Video using Kling O1
     * Transforms a static image into a dynamic video
     */
    async imageToVideo(params: KlingImageToVideoRequest): Promise<Buffer> {
        return this.requestBinary('kling-o1-image-to-video', {
            prompt: params.prompt,
            start_image_url: params.start_image_url,
            ...(params.end_image_url && { end_image_url: params.end_image_url }),
            duration: String(params.duration ?? 5),
        });
    }
}

// Export a factory function to create clients
export function createSegmindClient(apiKey?: string): SegmindClient {
    const key = apiKey || process.env.SEGMIND_API_KEY;
    if (!key) {
        throw new Error('SEGMIND_API_KEY is required');
    }
    return new SegmindClient(key);
}

export type { SegfitRequest, ZImageTurboRequest, FaceswapRequest, KlingImageToVideoRequest, SegmindResponse };
