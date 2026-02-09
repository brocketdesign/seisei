import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAdminClient } from '@/utils/storage';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { campaignId, products } = body as {
            campaignId: string;
            products: Array<{
                name: string;
                image_url: string;
                description?: string;
                category?: string;
                tags?: string;
            }>;
        };

        if (!campaignId) {
            return NextResponse.json({ error: 'キャンペーンを選択してください。' }, { status: 400 });
        }

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'インポートする商品がありません。' }, { status: 400 });
        }

        if (products.length > 500) {
            return NextResponse.json({ error: '一度にインポートできる商品は500件までです。' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        // Verify campaign belongs to user
        const { data: campaign } = await adminClient
            .from('campaigns')
            .select('id')
            .eq('id', campaignId)
            .eq('user_id', user.id)
            .single();

        if (!campaign) {
            return NextResponse.json({ error: 'キャンペーンが見つかりません。' }, { status: 404 });
        }

        const imported: number[] = [];
        const failed: Array<{ index: number; name: string; error: string }> = [];

        // Build rows for bulk insert, validating each
        const validRows: Array<{
            user_id: string;
            campaign_id: string;
            name: string;
            image_url: string;
            description: string | null;
            category: string | null;
            tags: string[] | null;
            is_active: boolean;
        }> = [];

        for (let i = 0; i < products.length; i++) {
            const p = products[i];
            const name = p.name?.trim();
            const imageUrl = p.image_url?.trim();

            if (!name) {
                failed.push({ index: i, name: name || `行 ${i + 1}`, error: '商品名が必要です。' });
                continue;
            }
            if (!imageUrl) {
                failed.push({ index: i, name, error: '画像URLが必要です。' });
                continue;
            }

            validRows.push({
                user_id: user.id,
                campaign_id: campaignId,
                name,
                image_url: imageUrl,
                description: p.description?.trim() || null,
                category: p.category?.trim() || null,
                tags: p.tags?.trim()
                    ? p.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                    : null,
                is_active: true,
            });
        }

        // Bulk insert valid rows
        if (validRows.length > 0) {
            const { data: insertedProducts, error: dbError } = await adminClient
                .from('products')
                .insert(validRows)
                .select('*');

            if (dbError) {
                return NextResponse.json({
                    error: `データベースエラー: ${dbError.message}`,
                }, { status: 500 });
            }

            return NextResponse.json({
                imported: insertedProducts?.length || 0,
                failed,
                products: insertedProducts || [],
            });
        }

        return NextResponse.json({
            imported: 0,
            failed,
            products: [],
        });
    } catch (error) {
        console.error('CSV import error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Internal server error',
        }, { status: 500 });
    }
}
