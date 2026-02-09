import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminClient, uploadImageToStorage } from '@/utils/storage';

export const maxDuration = 60;

/**
 * POST: Create a new AI model (uploaded or AI-generated).
 * Handles storage uploads server-side to bypass storage RLS.
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate via cookie-based client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            name,
            type,           // 'uploaded' | 'ai-generated'
            thumbnailData,  // base64 data URI of the face image
            modelData,      // { isActive, isLocked, bodyType, tags, age, ethnicity, sex }
        } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: 'モデル名を入力してください。' }, { status: 400 });
        }

        if (!thumbnailData) {
            return NextResponse.json({ error: '顔画像が必要です。' }, { status: 400 });
        }

        // Upload the thumbnail to storage using admin client (bypasses storage RLS)
        let thumbnailUrl: string;
        try {
            thumbnailUrl = await uploadImageToStorage(thumbnailData, `models/${user.id}`);
        } catch (uploadErr) {
            console.error('Thumbnail upload failed:', uploadErr);
            return NextResponse.json({ error: '画像のアップロードに失敗しました。' }, { status: 500 });
        }

        // Insert into ai_models using admin client (bypasses table RLS)
        const adminClient = getAdminClient();
        const { data: inserted, error: dbError } = await adminClient
            .from('ai_models')
            .insert({
                user_id: user.id,
                name: name.trim(),
                type: type || 'uploaded',
                thumbnail_url: thumbnailUrl,
                model_data: modelData || {},
            })
            .select('id, name, thumbnail_url, type, model_data')
            .single();

        if (dbError) {
            console.error('DB insert error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ model: inserted });
    } catch (error) {
        console.error('Model creation error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
