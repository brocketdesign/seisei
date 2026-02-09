import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiRequest } from '@/utils/api-auth';
import { getAdminClient } from '@/utils/storage';
import { sendEmail } from '@/utils/resend';

/**
 * POST /api/v1/email/generate
 *
 * Generate and optionally send a marketing email for a campaign/product.
 * Uses product and campaign data to build an email template.
 *
 * Body:
 *  - campaignId  (string, optional): UUID of the campaign
 *  - productId   (string, optional): UUID of the product
 *  - subject     (string, required): Email subject line
 *  - to          (string | string[], optional): Recipient(s) — if provided, the email is sent immediately
 *  - templateStyle (string, optional): 'minimal' | 'editorial' | 'promotional' (default: 'minimal')
 *  - customHtml  (string, optional): Use custom HTML instead of auto-generated template
 *  - replyTo     (string, optional): Reply-to email address
 */
export async function POST(request: NextRequest) {
    const auth = await authenticateApiRequest(request);
    if ('error' in auth) return auth.error;

    const { userId } = auth.user;

    try {
        const body = await request.json();
        const { campaignId, productId, subject, to, templateStyle, customHtml, replyTo } = body;

        if (!subject) {
            return NextResponse.json(
                { error: 'subject is required.' },
                { status: 400 },
            );
        }

        const adminClient = getAdminClient();
        let html = customHtml;

        // Auto-generate email HTML if no custom HTML provided
        if (!html) {
            let campaignName = '';
            let productName = '';
            let productImageUrl = '';
            let productDescription = '';

            // Fetch campaign data if provided
            if (campaignId) {
                const { data: campaign } = await adminClient
                    .from('campaigns')
                    .select('name, description')
                    .eq('id', campaignId)
                    .eq('user_id', userId)
                    .single();

                if (campaign) {
                    campaignName = campaign.name || '';
                }
            }

            // Fetch product data if provided
            if (productId) {
                const { data: product } = await adminClient
                    .from('products')
                    .select('name, description, image_url')
                    .eq('id', productId)
                    .eq('user_id', userId)
                    .single();

                if (product) {
                    productName = product.name || '';
                    productImageUrl = product.image_url || '';
                    productDescription = product.description || '';
                }
            }

            // Fetch latest generation image for the campaign/product if available
            let generatedImageUrl = '';
            if (campaignId) {
                const { data: latestGen } = await adminClient
                    .from('generations')
                    .select('generated_image_url')
                    .eq('user_id', userId)
                    .eq('campaign_id', campaignId)
                    .eq('status', 'completed')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                if (latestGen) {
                    generatedImageUrl = latestGen.generated_image_url || '';
                }
            }

            const heroImage = generatedImageUrl || productImageUrl;
            const style = templateStyle || 'minimal';

            html = buildEmailTemplate({
                style,
                subject,
                campaignName,
                productName,
                productDescription,
                heroImage,
            });
        }

        // If recipients provided, send the email immediately
        if (to) {
            const data = await sendEmail({ to, subject, html, replyTo });
            return NextResponse.json({
                success: true,
                sent: true,
                id: data?.id,
                html,
            });
        }

        // Otherwise, return the generated HTML for preview
        return NextResponse.json({
            success: true,
            sent: false,
            html,
        });
    } catch (error) {
        console.error('[api/v1/email/generate] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Email generation failed' },
            { status: 500 },
        );
    }
}

// ─── Email template builder ───────────────────────────────────────

interface TemplateParams {
    style: string;
    subject: string;
    campaignName: string;
    productName: string;
    productDescription: string;
    heroImage: string;
}

function buildEmailTemplate(params: TemplateParams): string {
    const { subject, campaignName, productName, productDescription, heroImage } = params;

    const title = campaignName || subject;
    const imageBlock = heroImage
        ? `<img src="${heroImage}" alt="${productName || 'Product'}" style="width:100%;max-width:560px;border-radius:8px;margin:24px 0;" />`
        : '';
    const productBlock = productName
        ? `<h2 style="margin:0 0 8px;font-size:20px;color:#111;">${productName}</h2>
           <p style="color:#6b7280;line-height:1.6;">${productDescription}</p>`
        : '';

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#000;padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">${title}</h1>
    </div>
    <div style="padding:40px;">
      ${imageBlock}
      ${productBlock}
    </div>
    <div style="padding:20px 40px;background:#f9fafb;border-top:1px solid #e5e7eb;">
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
        Powered by Seisei
      </p>
    </div>
  </div>
</body>
</html>`;
}
