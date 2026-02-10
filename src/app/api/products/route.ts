import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminClient, uploadImageToStorage } from '@/utils/storage';

/**
 * POST: Create a new product (quick-add from generate page).
 * Handles storage uploads server-side to bypass storage RLS.
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, campaignId, imageData, category, description, tags } = body;

        if (!name || !name.trim()) {
            return NextResponse.json({ error: '商品名を入力してください。' }, { status: 400 });
        }
        if (!campaignId) {
            return NextResponse.json({ error: 'キャンペーンを選択してください。' }, { status: 400 });
        }
        if (!imageData) {
            return NextResponse.json({ error: '商品画像が必要です。' }, { status: 400 });
        }

        // Upload image using admin client (bypasses storage RLS)
        let imageUrl: string;
        try {
            imageUrl = await uploadImageToStorage(imageData, `products/${user.id}`);
        } catch (uploadErr) {
            console.error('Product image upload failed:', uploadErr);
            return NextResponse.json({ error: '画像のアップロードに失敗しました。' }, { status: 500 });
        }

        // Insert using admin client (bypasses table RLS)
        const adminClient = getAdminClient();
        const { data: product, error: dbError } = await adminClient
            .from('products')
            .insert({
                user_id: user.id,
                campaign_id: campaignId,
                name: name.trim(),
                image_url: imageUrl,
                description: description || null,
                category: category || null,
                tags: tags || null,
                is_active: true,
            })
            .select()
            .single();

        if (dbError) {
            console.error('DB insert error:', dbError);
            return NextResponse.json({ error: dbError.message }, { status: 500 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error('Product creation error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
