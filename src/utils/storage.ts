import { createClient as createServiceClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'generation-images';

/**
 * Create a Supabase admin client using the service role key.
 * This bypasses RLS and is only used server-side for storage uploads
 * and database inserts in background async contexts (e.g. SSE streaming).
 */
export function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    return createServiceClient(url, serviceKey);
}

/**
 * Ensure the storage bucket exists (creates it if not).
 */
async function ensureBucket(admin: ReturnType<typeof getAdminClient>) {
    const { data } = await admin.storage.getBucket(BUCKET_NAME);
    if (!data) {
        await admin.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 50 * 1024 * 1024, // 50MB (for videos)
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm'],
        });
    }
}

/**
 * Upload a base64 data URI image to Supabase Storage and return the public URL.
 *
 * @param dataUri - A base64 data URI like "data:image/png;base64,iVBOR..."
 * @param folder  - Optional subfolder inside the bucket (e.g. "outfits", "models")
 * @returns Public URL string
 */
export async function uploadImageToStorage(
    dataUri: string,
    folder: string = 'uploads'
): Promise<string> {
    const admin = getAdminClient();
    await ensureBucket(admin);

    // Parse the data URI
    const match = dataUri.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
        throw new Error('Invalid data URI format. Expected "data:image/...;base64,..."');
    }

    const mimeType = match[1]; // e.g. "image/png"
    const base64Data = match[2];
    const ext = mimeType.split('/')[1]; // e.g. "png"

    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // Generate a unique file path
    const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await admin.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: false,
        });

    if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = admin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}

/**
 * Upload a raw video buffer to Supabase Storage and return the public URL.
 *
 * @param buffer   - The video file as a Buffer
 * @param folder   - Optional subfolder inside the bucket (e.g. "videos")
 * @param mimeType - The MIME type of the video (default: "video/mp4")
 * @returns Public URL string
 */
export async function uploadVideoToStorage(
    buffer: Buffer,
    folder: string = 'videos',
    mimeType: string = 'video/mp4'
): Promise<string> {
    const admin = getAdminClient();
    await ensureBucket(admin);

    const ext = mimeType.split('/')[1] || 'mp4';
    const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error } = await admin.storage
        .from(BUCKET_NAME)
        .upload(fileName, buffer, {
            contentType: mimeType,
            upsert: false,
        });

    if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
    }

    const { data: urlData } = admin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

    return urlData.publicUrl;
}
