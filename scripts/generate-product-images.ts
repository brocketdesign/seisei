/**
 * Generate product images for seeding campaigns
 * Run: npx tsx scripts/generate-product-images.ts
 *
 * Uses the Segmind Seedream 4.5 API to generate flat-lay garment images.
 * Images are saved to public/products/<campaign-folder>/<product>.webp
 *
 * Requires env var: SEGMIND_API_KEY (falls back to hardcoded key)
 */
import fs from 'fs';
import path from 'path';

const API_KEY = process.env.SEGMIND_API_KEY || 'SG_7729d35bb02bab18';
const API_URL = 'https://api.segmind.com/v1/seedream-4.5';

/**
 * Products grouped by campaign name (must match seed-campaigns.ts).
 * Each product has a filename, display name, category, description, tags and a prompt.
 */
export const campaignProducts: Record<
  string,
  {
    file: string;
    name: string;
    category: string;
    description: string;
    tags: string[];
    prompt: string;
  }[]
> = {
  '春コレクション 2026': [
    {
      file: 'spring-blouse',
      name: '花柄シフォンブラウス',
      category: 'トップス',
      description: '軽やかなシフォン素材に春らしい花柄をあしらったブラウス',
      tags: ['春', 'ブラウス', '花柄', 'シフォン'],
      prompt:
        'A beautiful floral chiffon blouse laid flat on a pure white background, pastel pink and lavender flower pattern, light airy fabric, spring fashion, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'spring-cardigan',
      name: 'パステルニットカーディガン',
      category: 'アウター',
      description: '淡いミントグリーンの軽量ニットカーディガン',
      tags: ['春', 'カーディガン', 'ニット', 'パステル'],
      prompt:
        'A lightweight knit cardigan in pastel mint green laid flat on a pure white background, soft cotton blend fabric, round neckline, spring fashion, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'spring-skirt',
      name: 'プリーツミディスカート',
      category: 'ボトムス',
      description: '上品なプリーツ加工のミディ丈スカート、ライトベージュ',
      tags: ['春', 'スカート', 'プリーツ', 'ミディ'],
      prompt:
        'An elegant pleated midi skirt in light beige laid flat on a pure white background, flowing fabric, spring fashion, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
  ],

  'バレンタイン特集': [
    {
      file: 'valentine-dress',
      name: 'レッドサテンワンピース',
      category: 'ワンピース',
      description: '鮮やかなレッドのサテン素材ワンピース、バレンタインデートに',
      tags: ['バレンタイン', 'ワンピース', 'レッド', 'サテン'],
      prompt:
        'A stunning red satin dress laid flat on a pure white background, elegant A-line silhouette, Valentine special, romantic fashion, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'valentine-knit',
      name: 'ハートモチーフニット',
      category: 'トップス',
      description: 'ハート柄の刺繍が可愛いピンクニットトップス',
      tags: ['バレンタイン', 'ニット', 'ハート', 'ピンク'],
      prompt:
        'A cute pink knit sweater with heart embroidery pattern laid flat on a pure white background, soft wool blend, Valentine theme, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'valentine-bag',
      name: 'ミニショルダーバッグ',
      category: 'バッグ',
      description: 'チェーンストラップのミニショルダーバッグ、ローズピンク',
      tags: ['バレンタイン', 'バッグ', 'ショルダー', 'ピンク'],
      prompt:
        'A small rose pink leather crossbody bag with gold chain strap laid flat on a pure white background, luxurious texture, Valentine accessory, e-commerce product photography, perfectly lit, 8k quality, photorealistic',
    },
  ],

  '新作デニムライン': [
    {
      file: 'denim-straight',
      name: 'ストレートデニム',
      category: 'ボトムス',
      description: 'クラシックなストレートシルエットのインディゴデニム',
      tags: ['デニム', 'ストレート', 'インディゴ'],
      prompt:
        'Classic straight-leg indigo denim jeans laid flat on a pure white background, medium wash, clean selvedge details, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'denim-jacket',
      name: 'オーバーサイズデニムジャケット',
      category: 'アウター',
      description: 'トレンドのオーバーサイズシルエット、ライトウォッシュ',
      tags: ['デニム', 'ジャケット', 'オーバーサイズ'],
      prompt:
        'An oversized light wash denim jacket laid flat on a pure white background, vintage style, brass buttons, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'denim-wide',
      name: 'ワイドレッグデニム',
      category: 'ボトムス',
      description: 'ゆったりワイドシルエットのダークウォッシュデニム',
      tags: ['デニム', 'ワイドレッグ', 'ダークウォッシュ'],
      prompt:
        'Wide-leg dark wash denim jeans laid flat on a pure white background, relaxed fit, modern silhouette, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
  ],

  '冬セール最終': [
    {
      file: 'winter-coat',
      name: 'ウールロングコート',
      category: 'アウター',
      description: 'キャメルカラーの上質ウールロングコート',
      tags: ['冬', 'コート', 'ウール', 'キャメル'],
      prompt:
        'A luxurious camel wool long coat laid flat on a pure white background, double-breasted, classic winter fashion, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'winter-sweater',
      name: 'ケーブルニットセーター',
      category: 'トップス',
      description: 'ケーブル編みのクリームホワイトセーター',
      tags: ['冬', 'セーター', 'ケーブルニット', 'ホワイト'],
      prompt:
        'A cream white cable knit sweater laid flat on a pure white background, chunky knit texture, cozy winter fashion, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'winter-boots',
      name: 'レザーアンクルブーツ',
      category: 'シューズ',
      description: 'ブラックレザーのサイドジップアンクルブーツ',
      tags: ['冬', 'ブーツ', 'レザー', 'ブラック'],
      prompt:
        'Black leather ankle boots with side zip laid on a pure white background, sleek design, low heel, winter footwear, e-commerce product photography, perfectly lit, 8k quality, photorealistic',
    },
  ],

  'Summer 2026': [
    {
      file: 'summer-tee',
      name: 'オーガニックコットンTシャツ',
      category: 'トップス',
      description: 'シンプルなホワイトのオーガニックコットンTシャツ',
      tags: ['夏', 'Tシャツ', 'コットン', 'ホワイト'],
      prompt:
        'A simple white organic cotton t-shirt laid flat on a pure white background, relaxed fit, summer casual, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'summer-shorts',
      name: 'リネンショートパンツ',
      category: 'ボトムス',
      description: '涼しげなネイビーリネンのショートパンツ',
      tags: ['夏', 'ショートパンツ', 'リネン', 'ネイビー'],
      prompt:
        'Navy linen shorts laid flat on a pure white background, relaxed fit, summer fashion, breathable fabric, e-commerce product photography, perfectly lit, no model, 8k quality, photorealistic',
    },
    {
      file: 'summer-sandals',
      name: 'レザーストラップサンダル',
      category: 'シューズ',
      description: 'タンカラーのレザーストラップフラットサンダル',
      tags: ['夏', 'サンダル', 'レザー', 'タン'],
      prompt:
        'Tan leather strap flat sandals laid on a pure white background, minimalist design, summer footwear, e-commerce product photography, perfectly lit, 8k quality, photorealistic',
    },
  ],
};

async function generateImage(prompt: string): Promise<Buffer> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: `Professional flat-lay product photography: ${prompt}`,
      size: '2K',
      width: 2048,
      height: 2048,
      aspect_ratio: '1:1',
      max_images: 1,
      sequential_image_generation: 'disabled',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

async function main() {
  const baseDir = path.join(__dirname, '..', 'public', 'products');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  const campaignNames = Object.keys(campaignProducts);
  let total = 0;
  let success = 0;

  for (const campaignName of campaignNames) {
    const products = campaignProducts[campaignName];
    // Create a folder per campaign using a sanitised name
    const folderName = campaignName.replace(/\s+/g, '-').replace(/[^\w\u3000-\u9FFFぁ-んァ-ヶー-]/g, '');
    const campaignDir = path.join(baseDir, folderName);
    if (!fs.existsSync(campaignDir)) {
      fs.mkdirSync(campaignDir, { recursive: true });
    }

    console.log(`\n📦 Campaign: ${campaignName}`);

    for (const product of products) {
      total++;
      const filePath = path.join(campaignDir, `${product.file}.webp`);

      // Skip if already generated
      if (fs.existsSync(filePath)) {
        console.log(`  ⏭  ${product.name} — already exists, skipping`);
        success++;
        continue;
      }

      console.log(`  🎨 Generating: ${product.name}...`);
      try {
        const buffer = await generateImage(product.prompt);
        fs.writeFileSync(filePath, buffer);
        console.log(`  ✓ Saved ${filePath} (${(buffer.length / 1024).toFixed(0)} KB)`);
        success++;
      } catch (err) {
        console.error(`  ✗ Failed: ${err}`);
      }
    }
  }

  console.log(`\n✅ Done! ${success}/${total} product images generated.`);
  console.log('Images saved to public/products/');
}

main();
