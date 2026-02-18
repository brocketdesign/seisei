/**
 * Segmind API Client
 * 
 * Models:
 * - seedream-4.5: Photorealistic image generation with multi-image input (face, clothes, accessories)
 * - segfit-v1.3: Virtual try-on for clothes (kept for v1 API backward compat)
 * - faceswap-v5: Face/head swapping (kept for v1 API backward compat)
 * - kling-o1-image-to-video: Image to video animation
 */

const SEGMIND_API_URL = 'https://api.segmind.com/v1';

/** Product types recognised by the prompt builder */
export type ProductType =
    | 'top'        // shirts, blouses, jackets, hoodies, sweaters, etc.
    | 'bottom'     // pants, skirts, shorts, etc.
    | 'dress'      // one-piece dresses, jumpsuits, etc.
    | 'outerwear'  // coats, blazers, parkas, etc.
    | 'shoes'      // footwear
    | 'accessory'; // bags, cups, hats, jewelry, scarves, etc.

interface SeedreamRequest {
    prompt: string;
    image_input?: string[];  // Array of public URLs (face, clothes, accessories)
    size?: string;           // e.g. '2K'
    width?: number;          // 1024-4096, default 2048
    height?: number;         // 1024-4096, default 2048
    aspect_ratio?: string;   // e.g. 'match_input_image', '1:1', '4:5', '9:16'
    max_images?: number;     // 1-15, default 1
    sequential_image_generation?: string; // 'disabled' | 'enabled'
}

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

/** Describes a product image to include in a Seedream generation */
export interface SeedreamProductInput {
    imageUrl: string;
    productType: ProductType;
    name?: string;
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
     * Generate photorealistic images using Seedream 4.5
     * Supports multi-image input: model face, clothing items, accessories
     */
    async seedreamGenerate(params: SeedreamRequest): Promise<SegmindResponse> {
        return this.request('seedream-4.5', {
            prompt: params.prompt,
            ...(params.image_input && params.image_input.length > 0 && { image_input: params.image_input }),
            size: params.size ?? '2K',
            width: params.width ?? 2048,
            height: params.height ?? 2048,
            aspect_ratio: params.aspect_ratio ?? (params.image_input?.length ? 'match_input_image' : '1:1'),
            max_images: params.max_images ?? 1,
            sequential_image_generation: params.sequential_image_generation ?? 'disabled',
        });
    }

    /**
     * Generate photorealistic images using Z-Image Turbo
     * @deprecated Use seedreamGenerate() instead. Kept for backward compatibility.
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

export type { SeedreamRequest, SegfitRequest, ZImageTurboRequest, FaceswapRequest, KlingImageToVideoRequest, SegmindResponse };

/**
 * Build a Seedream prompt that describes a photoshoot with a specific model
 * wearing the provided products (clothes, accessories, etc.).
 *
 * Each product has a `productType` so the prompt correctly labels garments
 * (avoiding e.g. a dress being described as a top).
 */
export function buildSeedreamPrompt(opts: {
    modelDescription: string;
    products: SeedreamProductInput[];
    background: string;
    customPrompt?: string;
}): string {
    const { modelDescription, products, background, customPrompt } = opts;

    // If user provided a fully custom prompt, use it with minimal wrapping
    if (customPrompt && customPrompt.trim().length > 0) {
        // Still include reference to the model and products so Seedream
        // knows what the reference images are
        const productDescriptions = products.map(p => {
            const label = productTypeLabel(p.productType);
            return p.name ? `the reference ${label} ("${p.name}")` : `the reference ${label}`;
        });
        const wearing = productDescriptions.length > 0
            ? ` wearing/holding ${productDescriptions.join(', ')}`
            : '';
        return `${customPrompt.trim()} The model is ${modelDescription}${wearing}.`;
    }

    // Auto-build prompt
    const clothingItems: string[] = [];
    const accessories: string[] = [];

    for (const p of products) {
        const label = p.name
            ? `the reference ${productTypeLabel(p.productType)} ("${p.name}")`
            : `the reference ${productTypeLabel(p.productType)}`;

        if (p.productType === 'accessory' || p.productType === 'shoes') {
            accessories.push(label);
        } else {
            clothingItems.push(label);
        }
    }

    let wearingClause = '';
    if (clothingItems.length > 0) {
        wearingClause = `wearing ${clothingItems.join(' and ')}`;
    }
    if (accessories.length > 0) {
        const accessoryClause = accessories.length === 1
            ? `with ${accessories[0]}`
            : `with ${accessories.join(' and ')}`;
        wearingClause = wearingClause
            ? `${wearingClause}, ${accessoryClause}`
            : accessoryClause;
    }

    const bgClause = background
        ? ` striking confident model poses ${background}.`
        : ' striking confident model poses.';

    return [
        `Create a professional fashion brand photoshoot of ${modelDescription}`,
        wearingClause ? `, ${wearingClause},` : ',',
        bgClause,
        ' Photorealistic, high quality fashion photography, 8K resolution, sharp focus, professional studio lighting.',
    ].join('');
}

function productTypeLabel(type: ProductType): string {
    switch (type) {
        case 'top': return 'top garment';
        case 'bottom': return 'bottom garment';
        case 'dress': return 'dress/one-piece';
        case 'outerwear': return 'outerwear/jacket';
        case 'shoes': return 'shoes/footwear';
        case 'accessory': return 'accessory';
        default: return 'clothing item';
    }
}
