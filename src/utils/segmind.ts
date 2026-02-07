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
    model_image: string; // base64 or URL of model/person image
    cloth_image: string; // base64 or URL of clothing image
    category?: 'Upper-body' | 'Lower-body' | 'Dress';
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
    source_image: string; // base64 or URL - face to put
    target_image: string; // base64 or URL - image to swap face onto
}

interface SegmindResponse {
    image?: string; // base64 encoded image
    status?: string;
    error?: string;
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

        // The API returns the image directly as binary
        const arrayBuffer = await response.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        return { image: `data:image/png;base64,${base64}` };
    }

    /**
     * Virtual try-on using SegFit v1.3
     * Put clothing on a model/person image
     */
    async virtualTryOn(params: SegfitRequest): Promise<SegmindResponse> {
        return this.request('segfit-v1.3', {
            model_image: params.model_image,
            cloth_image: params.cloth_image,
            category: params.category || 'Upper-body',
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
     */
    async faceSwap(params: FaceswapRequest): Promise<SegmindResponse> {
        return this.request('faceswap-v5', {
            source_img: params.source_image,
            target_img: params.target_image,
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

export type { SegfitRequest, ZImageTurboRequest, FaceswapRequest, SegmindResponse };
