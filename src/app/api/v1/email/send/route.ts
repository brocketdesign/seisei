import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, hasApiAccess } from '@/utils/api-keys';
import { sendEmail } from '@/utils/resend';

/**
 * POST /api/v1/email/send
 *
 * Public API endpoint for sending emails via API key.
 * Authentication: Bearer token in Authorization header.
 *
 * Body: { to: string | string[], subject: string, html: string, replyTo?: string }
 */
export async function POST(request: NextRequest) {
    // Extract API key from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json(
            { error: 'Missing or invalid Authorization header. Use: Bearer sk_live_...' },
            { status: 401 },
        );
    }

    const apiKey = authHeader.slice(7);
    const result = await validateApiKey(apiKey);

    if (!result.valid) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }

    // Verify the key owner still has API access
    if (!hasApiAccess(result.plan)) {
        console.error('[api/v1/email/send] API access denied — user:', result.userId, 'plan:', result.plan);
        return NextResponse.json(
            {
                error: 'API access requires a Business or Enterprise plan',
                currentPlan: result.plan,
                hint: 'If you recently upgraded, please wait a moment and try again, or contact support.',
            },
            { status: 403 },
        );
    }

    try {
        const { to, subject, html, replyTo } = await request.json();

        if (!to || !subject || !html) {
            return NextResponse.json(
                { error: 'Missing required fields: to, subject, html' },
                { status: 400 },
            );
        }

        const data = await sendEmail({ to, subject, html, replyTo });
        return NextResponse.json({ success: true, id: data?.id });
    } catch (error) {
        console.error('[api/v1/email/send] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to send email' },
            { status: 500 },
        );
    }
}
