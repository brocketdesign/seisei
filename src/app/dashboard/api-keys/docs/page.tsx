"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Mail,
    Package,
    Users,
    Image as ImageIcon,
    Video,
    Repeat,
    Copy,
    Check,
    AlertTriangle,
    CheckCircle2,
    Clock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────
type EndpointStatus = 'live' | 'coming-soon';

interface Endpoint {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    title: string;
    titleJa: string;
    description: string;
    status: EndpointStatus;
    icon: React.ReactNode;
    auth: string;
    headers?: Record<string, string>;
    bodyParams?: { name: string; type: string; required: boolean; description: string }[];
    queryParams?: { name: string; type: string; required: boolean; description: string }[];
    responseExample?: string;
    requestExample?: string;
    curlExample?: string;
}

// ─── Endpoint data ────────────────────────────────────────────────
const endpoints: Endpoint[] = [
    // === Email (LIVE) ===
    {
        method: 'POST',
        path: '/api/v1/email/send',
        title: 'Send Email',
        titleJa: 'メール送信',
        description: 'Send a transactional or marketing email via the Seisei platform. Supports single and batch recipients.',
        status: 'live',
        icon: <Mail className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        headers: {
            'Authorization': 'Bearer sk_live_...',
            'Content-Type': 'application/json',
        },
        bodyParams: [
            { name: 'to', type: 'string | string[]', required: true, description: 'Recipient email address(es).' },
            { name: 'subject', type: 'string', required: true, description: 'Email subject line.' },
            { name: 'html', type: 'string', required: true, description: 'HTML body of the email.' },
            { name: 'replyTo', type: 'string', required: false, description: 'Reply-to email address.' },
        ],
        requestExample: JSON.stringify({
            to: 'customer@example.com',
            subject: '新作コレクションのお知らせ',
            html: '<h1>春コレクション 2026</h1><p>新作アイテムをチェック！</p>',
            replyTo: 'support@yourbrand.com',
        }, null, 2),
        responseExample: JSON.stringify({
            success: true,
            id: 'msg_01abc123def456',
        }, null, 2),
        curlExample: `curl -X POST https://seisei.me/api/v1/email/send \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "customer@example.com",
    "subject": "新作コレクションのお知らせ",
    "html": "<h1>春コレクション</h1><p>新作をチェック！</p>"
  }'`,
    },

    // === Products ===
    {
        method: 'POST',
        path: '/api/v1/products',
        title: 'Create Product',
        titleJa: '商品登録',
        description: 'Register a new product with name, image, and campaign association.',
        status: 'coming-soon',
        icon: <Package className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        headers: {
            'Authorization': 'Bearer sk_live_...',
            'Content-Type': 'application/json',
        },
        bodyParams: [
            { name: 'name', type: 'string', required: true, description: 'Product name.' },
            { name: 'campaignId', type: 'string', required: true, description: 'UUID of the campaign to associate.' },
            { name: 'imageData', type: 'string', required: true, description: 'Base64 data URI of the product image.' },
            { name: 'description', type: 'string', required: false, description: 'Product description.' },
            { name: 'category', type: 'string', required: false, description: 'Product category.' },
            { name: 'tags', type: 'string', required: false, description: 'Comma-separated tags.' },
        ],
        requestExample: JSON.stringify({
            name: 'オーバーサイズTシャツ',
            campaignId: '550e8400-e29b-41d4-a716-446655440000',
            imageData: 'data:image/png;base64,iVBOR...',
            description: 'コットン100%のオーバーサイズTシャツ',
            category: 'トップス',
        }, null, 2),
        responseExample: JSON.stringify({
            product: {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'オーバーサイズTシャツ',
                image_url: 'https://storage.seisei.me/products/...',
                campaign_id: '550e8400-e29b-41d4-a716-446655440000',
                is_active: true,
            },
        }, null, 2),
    },
    {
        method: 'GET',
        path: '/api/v1/products',
        title: 'List Products',
        titleJa: '商品一覧',
        description: 'Retrieve all products for your account, optionally filtered by campaign.',
        status: 'coming-soon',
        icon: <Package className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        queryParams: [
            { name: 'campaignId', type: 'string', required: false, description: 'Filter by campaign UUID.' },
            { name: 'limit', type: 'number', required: false, description: 'Max number of results (default: 50).' },
            { name: 'offset', type: 'number', required: false, description: 'Pagination offset.' },
        ],
        responseExample: JSON.stringify({
            products: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440001',
                    name: 'オーバーサイズTシャツ',
                    image_url: 'https://storage.seisei.me/products/...',
                    campaign_id: '550e8400-e29b-41d4-a716-446655440000',
                    is_active: true,
                },
            ],
            total: 1,
        }, null, 2),
    },

    // === Models ===
    {
        method: 'POST',
        path: '/api/v1/models',
        title: 'Create Model',
        titleJa: 'モデル登録',
        description: 'Register a new AI model with a face photo for use in image generation and face-swap.',
        status: 'live',
        icon: <Users className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        headers: {
            'Authorization': 'Bearer sk_live_...',
            'Content-Type': 'application/json',
        },
        bodyParams: [
            { name: 'name', type: 'string', required: true, description: 'Model name.' },
            { name: 'thumbnailData', type: 'string', required: true, description: 'Base64 data URI of the face image.' },
            { name: 'type', type: "'uploaded' | 'ai-generated'", required: false, description: "Model type (default: 'uploaded')." },
            { name: 'modelData', type: 'object', required: false, description: 'Additional metadata (bodyType, tags, age, ethnicity, sex).' },
        ],
        requestExample: JSON.stringify({
            name: 'Model A',
            thumbnailData: 'data:image/jpeg;base64,/9j/4AAQ...',
            type: 'uploaded',
            modelData: {
                age: '20s',
                ethnicity: 'japanese',
                sex: 'female',
                bodyType: 'slim',
                tags: ['casual', 'street'],
            },
        }, null, 2),
        responseExample: JSON.stringify({
            model: {
                id: '660e8400-e29b-41d4-a716-446655440010',
                name: 'Model A',
                thumbnail_url: 'https://storage.seisei.me/models/...',
                type: 'uploaded',
            },
        }, null, 2),
    },
    {
        method: 'GET',
        path: '/api/v1/models',
        title: 'List Models',
        titleJa: 'モデル一覧',
        description: 'Retrieve all AI models registered to your account.',
        status: 'live',
        icon: <Users className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        queryParams: [
            { name: 'limit', type: 'number', required: false, description: 'Max number of results (default: 50).' },
            { name: 'offset', type: 'number', required: false, description: 'Pagination offset.' },
        ],
        responseExample: JSON.stringify({
            models: [
                {
                    id: '660e8400-e29b-41d4-a716-446655440010',
                    name: 'Model A',
                    thumbnail_url: 'https://storage.seisei.me/models/...',
                    type: 'uploaded',
                },
            ],
            total: 1,
        }, null, 2),
    },

    // === Virtual Try-On ===
    {
        method: 'POST',
        path: '/api/v1/generate/virtual-tryon',
        title: 'Virtual Try-On',
        titleJa: 'バーチャル試着',
        description: 'Takes a product/outfit image and a model image, generates the model wearing the outfit using SegFit v1.3.',
        status: 'live',
        icon: <ImageIcon className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        headers: {
            'Authorization': 'Bearer sk_live_...',
            'Content-Type': 'application/json',
        },
        bodyParams: [
            { name: 'outfitImage', type: 'string', required: true, description: 'Base64 data URI of the garment/outfit image.' },
            { name: 'modelImage', type: 'string', required: true, description: 'Base64 data URI or public URL of the model image.' },
            { name: 'campaignId', type: 'string', required: false, description: 'Campaign UUID to associate the generation with.' },
            { name: 'aspectRatio', type: "'1:1' | '4:5' | '9:16'", required: false, description: "Output aspect ratio (default: '1:1')." },
        ],
        requestExample: JSON.stringify({
            outfitImage: 'data:image/png;base64,iVBOR...',
            modelImage: 'https://storage.seisei.me/models/model-a.jpg',
            aspectRatio: '4:5',
            campaignId: '550e8400-e29b-41d4-a716-446655440000',
        }, null, 2),
        responseExample: JSON.stringify({
            success: true,
            image_url: 'https://storage.seisei.me/generations/...',
            generation_id: '770e8400-e29b-41d4-a716-446655440020',
            generation_time: '2.3s',
            credits_used: 1,
        }, null, 2),
        curlExample: `curl -X POST https://seisei.me/api/v1/generate/virtual-tryon \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "outfitImage": "data:image/png;base64,iVBOR...",
    "modelImage": "https://storage.seisei.me/models/model-a.jpg"
  }'`,
    },

    // === Face Swap ===
    {
        method: 'POST',
        path: '/api/v1/generate/faceswap',
        title: 'Face Swap',
        titleJa: 'フェイススワップ',
        description: 'Swap a face from a source image onto a target image. Useful for applying a model\'s face to generated content.',
        status: 'live',
        icon: <Repeat className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        headers: {
            'Authorization': 'Bearer sk_live_...',
            'Content-Type': 'application/json',
        },
        bodyParams: [
            { name: 'sourceImage', type: 'string', required: true, description: 'Base64 data URI or URL of the face source image.' },
            { name: 'targetImage', type: 'string', required: true, description: 'Base64 data URI or URL of the target image.' },
            { name: 'campaignId', type: 'string', required: false, description: 'Campaign UUID to associate the generation with.' },
        ],
        requestExample: JSON.stringify({
            sourceImage: 'data:image/jpeg;base64,/9j/4AAQ...',
            targetImage: 'data:image/jpeg;base64,/9j/4AAQ...',
        }, null, 2),
        responseExample: JSON.stringify({
            success: true,
            image_url: 'https://storage.seisei.me/generations/...',
            generation_id: '880e8400-e29b-41d4-a716-446655440030',
            generation_time: '1.8s',
            credits_used: 1,
        }, null, 2),
        curlExample: `curl -X POST https://seisei.me/api/v1/generate/faceswap \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "sourceImage": "data:image/jpeg;base64,/9j/4AAQ...",
    "targetImage": "data:image/jpeg;base64,/9j/4AAQ..."
  }'`,
    },

    // === Editorial (Full Pipeline) ===
    {
        method: 'POST',
        path: '/api/v1/generate/editorial',
        title: 'Editorial / Full Pipeline',
        titleJa: 'エディトリアル生成',
        description: 'Full editorial pipeline: generates an AI model, applies face-swap (if avatar provided), and performs virtual try-on with the outfit.',
        status: 'live',
        icon: <ImageIcon className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        headers: {
            'Authorization': 'Bearer sk_live_...',
            'Content-Type': 'application/json',
        },
        bodyParams: [
            { name: 'outfitImage', type: 'string', required: true, description: 'Base64 data URI of the garment/outfit image.' },
            { name: 'modelId', type: 'string', required: false, description: 'UUID of an existing AI model to use.' },
            { name: 'modelData', type: 'object', required: false, description: 'Inline model attributes { id, name, age, ethnicity, bodyType, tags, avatar, sex }.' },
            { name: 'background', type: "'studio' | 'outdoor' | 'cafe' | 'natural'", required: false, description: "Background style (default: 'studio')." },
            { name: 'aspectRatio', type: "'1:1' | '4:5' | '9:16'", required: false, description: "Output aspect ratio (default: '1:1')." },
            { name: 'campaignId', type: 'string', required: false, description: 'Campaign UUID to associate the generation with.' },
        ],
        requestExample: JSON.stringify({
            outfitImage: 'data:image/png;base64,iVBOR...',
            modelId: '660e8400-e29b-41d4-a716-446655440010',
            background: 'studio',
            aspectRatio: '4:5',
            campaignId: '550e8400-e29b-41d4-a716-446655440000',
        }, null, 2),
        responseExample: JSON.stringify({
            success: true,
            image_url: 'https://storage.seisei.me/generations/...',
            generation_id: '770e8400-e29b-41d4-a716-446655440020',
            generation_time: '8.5s',
            credits_used: 1,
        }, null, 2),
        curlExample: `curl -X POST https://seisei.me/api/v1/generate/editorial \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "outfitImage": "data:image/png;base64,iVBOR...",
    "modelId": "660e8400-e29b-41d4-a716-446655440010",
    "background": "studio"
  }'`,
    },

    // === Campaigns ===
    {
        method: 'GET',
        path: '/api/v1/campaigns',
        title: 'List Campaigns',
        titleJa: 'キャンペーン一覧',
        description: 'Retrieve all campaigns for your account, optionally filtered by status.',
        status: 'live',
        icon: <Package className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        queryParams: [
            { name: 'status', type: 'string', required: false, description: "Filter by status ('draft' | 'active' | 'scheduled' | 'completed')." },
            { name: 'limit', type: 'number', required: false, description: 'Max number of results (default: 50).' },
            { name: 'offset', type: 'number', required: false, description: 'Pagination offset.' },
        ],
        responseExample: JSON.stringify({
            campaigns: [
                {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    name: '春コレクション 2026',
                    description: 'Spring collection campaign',
                    status: 'active',
                    created_at: '2026-01-15T00:00:00.000Z',
                },
            ],
            total: 1,
        }, null, 2),
        curlExample: `curl -X GET "https://seisei.me/api/v1/campaigns?status=active" \\
  -H "Authorization: Bearer sk_live_..."`,
    },
    {
        method: 'GET',
        path: '/api/v1/campaigns/:id',
        title: 'Get Campaign',
        titleJa: 'キャンペーン詳細',
        description: 'Get a single campaign by ID, including its products and generation count.',
        status: 'live',
        icon: <Package className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        responseExample: JSON.stringify({
            campaign: {
                id: '550e8400-e29b-41d4-a716-446655440000',
                name: '春コレクション 2026',
                status: 'active',
                products: [
                    { id: '...', name: 'オーバーサイズTシャツ', image_url: '...' },
                ],
                generation_count: 12,
            },
        }, null, 2),
        curlExample: `curl -X GET "https://seisei.me/api/v1/campaigns/550e8400-e29b-41d4-a716-446655440000" \\
  -H "Authorization: Bearer sk_live_..."`,
    },
    {
        method: 'POST',
        path: '/api/v1/campaigns',
        title: 'Create Campaign',
        titleJa: 'キャンペーン作成',
        description: 'Create a new campaign via API.',
        status: 'coming-soon',
        icon: <Package className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
    },

    // === Email Generate ===
    {
        method: 'POST',
        path: '/api/v1/email/generate',
        title: 'Generate Email',
        titleJa: 'メール生成',
        description: 'Generate marketing email HTML from campaign/product data. Optionally send immediately.',
        status: 'live',
        icon: <Mail className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        headers: {
            'Authorization': 'Bearer sk_live_...',
            'Content-Type': 'application/json',
        },
        bodyParams: [
            { name: 'subject', type: 'string', required: true, description: 'Email subject line.' },
            { name: 'campaignId', type: 'string', required: false, description: 'UUID of the campaign to pull data from.' },
            { name: 'productId', type: 'string', required: false, description: 'UUID of the product to feature.' },
            { name: 'to', type: 'string | string[]', required: false, description: 'Recipient(s) — if provided, email is sent immediately.' },
            { name: 'templateStyle', type: "'minimal' | 'editorial' | 'promotional'", required: false, description: "Template style (default: 'minimal')." },
            { name: 'customHtml', type: 'string', required: false, description: 'Custom HTML body (skips template generation).' },
            { name: 'replyTo', type: 'string', required: false, description: 'Reply-to email address.' },
        ],
        requestExample: JSON.stringify({
            subject: '春コレクション新作のお知らせ',
            campaignId: '550e8400-e29b-41d4-a716-446655440000',
            productId: '550e8400-e29b-41d4-a716-446655440001',
            to: 'customer@example.com',
        }, null, 2),
        responseExample: JSON.stringify({
            success: true,
            sent: true,
            id: 'msg_01abc123def456',
            html: '<!DOCTYPE html><html>...</html>',
        }, null, 2),
        curlExample: `curl -X POST https://seisei.me/api/v1/email/generate \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "subject": "春コレクション新作のお知らせ",
    "campaignId": "550e8400-e29b-41d4-a716-446655440000"
  }'`,
    },

    // === Video Generation ===
    {
        method: 'POST',
        path: '/api/v1/generate/video',
        title: 'Generate Video',
        titleJa: '動画生成',
        description: 'Generate an animated video from a source image. Supports prompt-based animation and templates.',
        status: 'coming-soon',
        icon: <Video className="w-4 h-4" />,
        auth: 'Bearer sk_live_...',
        headers: {
            'Authorization': 'Bearer sk_live_...',
            'Content-Type': 'application/json',
        },
        bodyParams: [
            { name: 'sourceImageUrl', type: 'string', required: true, description: 'Public URL of the source image to animate.' },
            { name: 'prompt', type: 'string', required: true, description: 'Animation prompt describing the desired motion.' },
            { name: 'template', type: 'string', required: false, description: 'Animation template name.' },
            { name: 'duration', type: 'number', required: false, description: 'Duration in seconds (default: 5).' },
            { name: 'generationId', type: 'string', required: false, description: 'UUID of the source image generation.' },
            { name: 'aiModelId', type: 'string', required: false, description: 'UUID of the AI model.' },
            { name: 'campaignId', type: 'string', required: false, description: 'UUID of the campaign.' },
        ],
        requestExample: JSON.stringify({
            sourceImageUrl: 'https://storage.seisei.me/generations/image.jpg',
            prompt: 'Model slowly turns and smiles at camera',
            duration: 5,
            campaignId: '550e8400-e29b-41d4-a716-446655440000',
        }, null, 2),
        responseExample: JSON.stringify({
            video: {
                id: '990e8400-e29b-41d4-a716-446655440040',
                video_url: 'https://storage.seisei.me/videos/...',
                status: 'completed',
                duration: 5,
            },
        }, null, 2),
    },
];

// ─── Method badge color ───────────────────────────────────────────
function methodColor(method: string) {
    switch (method) {
        case 'GET':    return 'bg-emerald-100 text-emerald-700';
        case 'POST':   return 'bg-blue-100 text-blue-700';
        case 'PUT':    return 'bg-amber-100 text-amber-700';
        case 'PATCH':  return 'bg-amber-100 text-amber-700';
        case 'DELETE': return 'bg-red-100 text-red-700';
        default:       return 'bg-gray-100 text-gray-700';
    }
}

// ─── Code block with copy button ──────────────────────────────────
function CodeBlock({ code, language = 'json' }: { code: string; language?: string }) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div className="relative group">
            <pre className={`text-xs bg-gray-950 text-gray-200 rounded-lg p-4 overflow-x-auto font-mono leading-relaxed language-${language}`}>
                {code}
            </pre>
            <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-800 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                title="コピー"
            >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
        </div>
    );
}

// ─── Status badge ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: EndpointStatus }) {
    if (status === 'live') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                <CheckCircle2 className="w-3 h-3" />
                LIVE
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            COMING SOON
        </span>
    );
}

// ─── Endpoint card ────────────────────────────────────────────────
function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
    const [expanded, setExpanded] = useState(endpoint.status === 'live');

    return (
        <div id={endpoint.path.replace(/\//g, '-').slice(1)} className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-gray-50/50 transition-colors"
            >
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {endpoint.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${methodColor(endpoint.method)}`}>
                            {endpoint.method}
                        </span>
                        <code className="text-sm font-mono text-gray-700 truncate">{endpoint.path}</code>
                        <StatusBadge status={endpoint.status} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{endpoint.titleJa} — {endpoint.description}</p>
                </div>
                <svg
                    className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Expanded content */}
            {expanded && (
                <div className="border-t border-gray-100 p-4 sm:p-5 space-y-5">
                    {/* Coming soon warning */}
                    {endpoint.status === 'coming-soon' && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-amber-800">
                                このエンドポイントは現在開発中です。近日中に実装予定です。APIの仕様は変更される可能性があります。
                            </p>
                        </div>
                    )}

                    {/* Authentication */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-900 mb-2">認証 / Authentication</h4>
                        <p className="text-xs text-gray-600">
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[11px] font-mono">Authorization</code> ヘッダーにAPIキーをBearer tokenとして設定してください。
                        </p>
                        <div className="mt-2">
                            <CodeBlock code={`Authorization: Bearer sk_live_...`} language="http" />
                        </div>
                    </div>

                    {/* Headers */}
                    {endpoint.headers && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-2">ヘッダー / Headers</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Header</th>
                                            <th className="text-left py-2 font-semibold text-gray-700">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(endpoint.headers).map(([key, value]) => (
                                            <tr key={key} className="border-b border-gray-50">
                                                <td className="py-2 pr-4 font-mono text-gray-700">{key}</td>
                                                <td className="py-2 font-mono text-gray-500">{value}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Query params */}
                    {endpoint.queryParams && endpoint.queryParams.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-2">クエリパラメータ / Query Parameters</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Name</th>
                                            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Type</th>
                                            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Required</th>
                                            <th className="text-left py-2 font-semibold text-gray-700">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {endpoint.queryParams.map(p => (
                                            <tr key={p.name} className="border-b border-gray-50">
                                                <td className="py-2 pr-4 font-mono text-gray-700">{p.name}</td>
                                                <td className="py-2 pr-4 font-mono text-gray-500">{p.type}</td>
                                                <td className="py-2 pr-4">{p.required ? <span className="text-red-600 font-semibold">Yes</span> : <span className="text-gray-400">No</span>}</td>
                                                <td className="py-2 text-gray-600">{p.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Body params */}
                    {endpoint.bodyParams && endpoint.bodyParams.length > 0 && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-2">リクエストボディ / Request Body</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Name</th>
                                            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Type</th>
                                            <th className="text-left py-2 pr-4 font-semibold text-gray-700">Required</th>
                                            <th className="text-left py-2 font-semibold text-gray-700">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {endpoint.bodyParams.map(p => (
                                            <tr key={p.name} className="border-b border-gray-50">
                                                <td className="py-2 pr-4 font-mono text-gray-700">{p.name}</td>
                                                <td className="py-2 pr-4 font-mono text-gray-500">{p.type}</td>
                                                <td className="py-2 pr-4">{p.required ? <span className="text-red-600 font-semibold">Yes</span> : <span className="text-gray-400">No</span>}</td>
                                                <td className="py-2 text-gray-600">{p.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Request example */}
                    {endpoint.requestExample && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-2">リクエスト例 / Request Example</h4>
                            <CodeBlock code={endpoint.requestExample} />
                        </div>
                    )}

                    {/* cURL example */}
                    {endpoint.curlExample && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-2">cURL</h4>
                            <CodeBlock code={endpoint.curlExample} language="bash" />
                        </div>
                    )}

                    {/* Response example */}
                    {endpoint.responseExample && (
                        <div>
                            <h4 className="text-xs font-semibold text-gray-900 mb-2">レスポンス例 / Response Example</h4>
                            <CodeBlock code={endpoint.responseExample} />
                        </div>
                    )}

                    {/* Error responses */}
                    <div>
                        <h4 className="text-xs font-semibold text-gray-900 mb-2">エラーレスポンス / Error Responses</h4>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="text-left py-2 pr-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-2 font-semibold text-gray-700">Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-2 pr-4 font-mono text-red-600">401</td>
                                        <td className="py-2 text-gray-600">Invalid or missing API key.</td>
                                    </tr>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-2 pr-4 font-mono text-red-600">403</td>
                                        <td className="py-2 text-gray-600">API access requires Business or Enterprise plan.</td>
                                    </tr>
                                    <tr className="border-b border-gray-50">
                                        <td className="py-2 pr-4 font-mono text-red-600">400</td>
                                        <td className="py-2 text-gray-600">Missing or invalid request parameters.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-2 pr-4 font-mono text-red-600">500</td>
                                        <td className="py-2 text-gray-600">Internal server error.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main page ────────────────────────────────────────────────────
export default function ApiDocsPage() {
    const liveCount = endpoints.filter(e => e.status === 'live').length;
    const comingSoonCount = endpoints.filter(e => e.status === 'coming-soon').length;

    return (
        <>
            <header className="mb-6 sm:mb-8">
                <Link
                    href="/dashboard/api-keys"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-4"
                >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    API連携に戻る
                </Link>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">APIドキュメント</h2>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    Seisei APIのエンドポイント一覧と仕様です。すべてのリクエストにはAPIキーによる認証が必要です。
                </p>
            </header>

            {/* Overview */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-4 sm:p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">概要</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-400 font-medium mb-1">Base URL</p>
                        <code className="text-xs font-mono text-gray-800">https://seisei.me</code>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-400 font-medium mb-1">認証方式</p>
                        <p className="text-xs text-gray-800">Bearer Token (APIキー)</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-[10px] text-gray-400 font-medium mb-1">対応プラン</p>
                        <p className="text-xs text-gray-800">Business / Enterprise</p>
                    </div>
                </div>
            </div>

            {/* Status summary */}
            <div className="flex items-center gap-4 mb-6">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    {liveCount} endpoint{liveCount !== 1 ? 's' : ''} live
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    {comingSoonCount} coming soon
                </span>
            </div>

            {/* Table of contents */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mb-6">
                <h3 className="text-xs font-semibold text-gray-900 mb-3">エンドポイント一覧</h3>
                <div className="space-y-1.5">
                    {endpoints.map(ep => (
                        <a
                            key={ep.path}
                            href={`#${ep.path.replace(/\//g, '-').slice(1)}`}
                            className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 transition-colors py-1"
                        >
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono ${methodColor(ep.method)}`}>
                                {ep.method}
                            </span>
                            <code className="font-mono">{ep.path}</code>
                            <StatusBadge status={ep.status} />
                            <span className="text-gray-400 ml-auto hidden sm:inline">{ep.titleJa}</span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Endpoint cards */}
            <div className="space-y-4">
                {endpoints.map(ep => (
                    <EndpointCard key={ep.path} endpoint={ep} />
                ))}
            </div>

            {/* Rate limits note */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 mt-6">
                <h3 className="text-xs font-semibold text-gray-900 mb-2">レート制限 / Rate Limits</h3>
                <p className="text-xs text-gray-600">
                    APIリクエストはプランに応じた月間制限があります。画像生成・動画生成はそれぞれのプランの月間クォータに含まれます。
                    詳しくは<Link href="/dashboard/settings" className="text-black underline hover:no-underline">プラン設定</Link>をご確認ください。
                </p>
            </div>
        </>
    );
}
