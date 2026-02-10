import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { createSegmindClient } from '@/utils/segmind';
import { getAdminClient, uploadImageToStorage } from '@/utils/storage';

export const maxDuration = 120;

/**
 * GET /api/v1/models
 *
 * List all AI models for the authenticated user.
 *
 * Query params:
 *  - limit  (number, optional): Max results (default: 50)
 *  - offset (number, optional): Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const { searchParams } = new URL(request.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const adminClient = getAdminClient();

        const { data: models, count, error } = await adminClient
            .from('ai_models')
            .select('id, name, thumbnail_url, type, model_data, created_at', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[api/v1/models] DB error:', error);
            return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
        }

        return NextResponse.json({
            models: models || [],
            total: count ?? 0,
        });
    } catch (error) {
        console.error('[api/v1/models] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to fetch models' },
            { status: 500 },
        );
    }
}

/**
 * POST /api/v1/models
 *
 * Create a new AI model.
 *
 * Two modes:
 *  1. Upload mode: provide `thumbnailData` (base64 data URI of the face image)
 *  2. Generate mode: provide `prompt` to generate the model image via AI
 *
 * Body:
 *  - name          (string, required): Model name
 *  - thumbnailData (string, optional): Base64 data URI of the face image (upload mode)
 *  - prompt        (string, optional): AI prompt to generate the model image (generate mode)
 *  - sex           (string, required for generate mode): 'male' | 'female'
 *  - age           (number, optional): Model age
 *  - ethnicity     (string, optional): e.g. 'Japanese', 'Asian', 'Caucasian', 'Mixed'
 *  - bodyType      (string, optional): 'Slim' | 'Athletic' | 'Curvy'
 *  - tags          (string[], optional): e.g. ['Cute', 'Casual']
 *  - type          (string, optional): 'uploaded' | 'ai-generated' (auto-set based on mode)
 *  - modelData     (object, optional): Legacy — { bodyType, tags, age, ethnicity, sex }
 */
export async function POST(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const body = await request.json();
        const { name, thumbnailData, prompt, sex, age, ethnicity, bodyType, tags, type, modelData } = body;

        if (!name || !name.trim()) {
            return NextResponse.json(
                { error: 'name is required.' },
                { status: 400 },
            );
        }

        // Determine mode: generate (prompt provided) or upload (thumbnailData provided)
        const isGenerateMode = !!prompt;

        if (!isGenerateMode && !thumbnailData) {
            return NextResponse.json(
                { error: 'Either prompt (to generate) or thumbnailData (to upload) is required.' },
                { status: 400 },
            );
        }

        if (isGenerateMode && !sex) {
            return NextResponse.json(
                { error: 'sex is required when using prompt-based generation ("male" or "female").' },
                { status: 400 },
            );
        }

        let thumbnailUrl: string;

        if (isGenerateMode) {
            // Generate model image via Segmind z-image-turbo
            const segmind = createSegmindClient();
            const imageResult = await segmind.generateImage({
                prompt: prompt.trim(),
                steps: 8,
                guidance_scale: 1,
                seed: -1,
                width: 1024,
                height: 1024,
                image_format: 'png',
                quality: 95,
                base_64: false,
            });

            if (!imageResult.image) {
                return NextResponse.json({ error: 'Failed to generate model image.' }, { status: 500 });
            }

            thumbnailUrl = await uploadImageToStorage(imageResult.image, `models/${userId}`);
        } else {
            // Upload mode
            try {
                thumbnailUrl = await uploadImageToStorage(thumbnailData, `models/${userId}`);
            } catch (uploadErr) {
                console.error('Thumbnail upload failed:', uploadErr);
                return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });
            }
        }

        // Build model_data — prefer top-level params, fall back to legacy modelData object
        const resolvedModelData = {
            bodyType: bodyType || modelData?.bodyType || 'Slim',
            tags: tags || modelData?.tags || [],
            age: age || modelData?.age,
            ethnicity: ethnicity || modelData?.ethnicity,
            sex: sex || modelData?.sex || 'female',
            ...(modelData || {}),
            // Re-apply top-level overrides
            ...(bodyType && { bodyType }),
            ...(tags && { tags }),
            ...(age && { age }),
            ...(ethnicity && { ethnicity }),
            ...(sex && { sex }),
        };

        // Insert into ai_models
        const adminClient = getAdminClient();
        const { data: inserted, error: dbError } = await adminClient
            .from('ai_models')
            .insert({
                user_id: userId,
                name: name.trim(),
                type: isGenerateMode ? 'ai-generated' : (type || 'uploaded'),
                thumbnail_url: thumbnailUrl,
                model_data: resolvedModelData,
            })
            .select('id, name, thumbnail_url, type, model_data')
            .single();

        if (dbError) {
            console.error('DB insert error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ model: inserted });
    } catch (error) {
        console.error('[api/v1/models] Error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
